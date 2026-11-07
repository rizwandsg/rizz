-- Run against a disposable staging copy first. This transaction fails on invalid legacy data.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
  full_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN is_active SET NOT NULL;
-- Legacy hashes are retained for a separately reviewed migration, never granted to clients.
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password_hash') THEN
    ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_identity ON public.users(clerk_user_id) WHERE clerk_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized ON public.users(lower(email));
-- The hosted legacy schema already has users_role_check for the role enum.
-- Retain it and add the stronger relationship check under a distinct name.
ALTER TABLE public.users ADD CONSTRAINT users_workspace_role_check CHECK ((role='owner' AND parent_user_id IS NULL) OR (role='member' AND parent_user_id IS NOT NULL AND parent_user_id <> id));

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES public.users(id) NOT NULL,
  name text NOT NULL, description text, start_date date NOT NULL, end_date date,
  status text DEFAULT 'active', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_project_cost numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS scope_of_work text[];
ALTER TABLE public.projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.projects ADD CONSTRAINT projects_valid_dates CHECK (end_date IS NULL OR end_date >= start_date);
ALTER TABLE public.projects ADD CONSTRAINT projects_valid_cost CHECK (total_project_cost IS NULL OR (total_project_cost >= 0 AND total_project_cost <= 9999999999.99 AND total_project_cost = round(total_project_cost,2)));
ALTER TABLE public.projects ADD CONSTRAINT projects_valid_name CHECK (length(trim(name)) > 0);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid REFERENCES public.projects(id) NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL, amount numeric NOT NULL, description text NOT NULL,
  category text, expense_date date NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS scope_of_work text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS vendor_name text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS vendor_contact text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Unpaid';
ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_valid_amount CHECK (amount > 0 AND amount <= 9999999999.99 AND amount = round(amount,2));
ALTER TABLE public.expenses ADD CONSTRAINT expenses_valid_description CHECK (length(trim(description)) > 0);
ALTER TABLE public.expenses ADD CONSTRAINT expenses_project_pair UNIQUE(id,project_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id),
  user_id uuid NOT NULL REFERENCES public.users(id), amount numeric NOT NULL, payment_date date NOT NULL,
  payment_type text NOT NULL, payment_mode text NOT NULL, reference_number text, notes text, received_from text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id),
  user_id uuid NOT NULL REFERENCES public.users(id), amount numeric NOT NULL, payment_date date NOT NULL,
  payment_method text NOT NULL, reference_number text, notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), expense_id uuid NOT NULL REFERENCES public.expenses(id),
  project_id uuid NOT NULL REFERENCES public.projects(id), user_id uuid NOT NULL REFERENCES public.users(id),
  amount numeric NOT NULL, payment_date date NOT NULL, payment_method text NOT NULL,
  vendor_name text NOT NULL, vendor_contact text, reference_number text, notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.vendor_payments ADD CONSTRAINT vendor_payment_expense_project FOREIGN KEY(expense_id,project_id) REFERENCES public.expenses(id,project_id);

CREATE OR REPLACE FUNCTION private.current_profile_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u.id FROM public.users u
  WHERE u.clerk_user_id = (auth.jwt()->>'sub') AND u.is_active
    AND (u.parent_user_id IS NULL OR EXISTS (SELECT 1 FROM public.users p WHERE p.id=u.parent_user_id AND p.is_active AND p.role='owner' AND p.parent_user_id IS NULL))
$$;
CREATE OR REPLACE FUNCTION private.workspace_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(u.parent_user_id,u.id) FROM public.users u WHERE u.id=private.current_profile_id()
$$;
CREATE OR REPLACE FUNCTION private.can_access_project(project uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS(SELECT 1 FROM public.projects p JOIN public.users u ON u.id=p.user_id
    WHERE p.id=project AND coalesce(u.parent_user_id,u.id)=private.workspace_id())
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION public.request_identity() RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$ SELECT auth.jwt()->>'sub' $$;
REVOKE ALL ON FUNCTION public.request_identity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_identity() TO authenticated;
CREATE OR REPLACE FUNCTION public.backend_contract_version() RETURNS integer
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$ SELECT 2 $$;
REVOKE ALL ON FUNCTION public.backend_contract_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backend_contract_version() TO anon,authenticated;

-- Remove permissive legacy policies; permissive policies combine with OR.
DO $$ DECLARE item record; tab text; BEGIN
  FOR item IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('users','projects','expenses','payments','customer_payments','vendor_payments') LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I',item.policyname,item.schemaname,item.tablename);
  END LOOP;
  FOREACH tab IN ARRAY ARRAY['users','projects','expenses','payments','customer_payments','vendor_payments'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tab);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',tab);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',tab);
  END LOOP;
END $$;
DO $$ DECLARE col record; BEGIN
  FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.users'::regclass AND attnum>0 AND NOT attisdropped LOOP
    EXECUTE format('REVOKE ALL (%I) ON public.users FROM PUBLIC,anon,authenticated',col.attname);
  END LOOP;
END $$;
GRANT SELECT(id,clerk_user_id,email,full_name,phone,role,parent_user_id,is_active,created_at,updated_at,last_login) ON public.users TO authenticated;
CREATE POLICY users_workspace_read ON public.users FOR SELECT TO authenticated
  USING (coalesce(parent_user_id,id)=private.workspace_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.projects,public.expenses,public.payments,public.customer_payments,public.vendor_payments TO authenticated;
CREATE POLICY projects_workspace ON public.projects FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users u WHERE u.id=user_id AND coalesce(u.parent_user_id,u.id)=private.workspace_id()))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users u WHERE u.id=user_id AND coalesce(u.parent_user_id,u.id)=private.workspace_id()));

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY['expenses','payments','customer_payments','vendor_payments'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (amount > 0 AND amount <= 9999999999.99 AND amount = round(amount,2))',tab,tab||'_money_check');
    EXECUTE format('CREATE POLICY workspace_access ON public.%I FOR ALL TO authenticated USING (private.can_access_project(project_id)) WITH CHECK (private.can_access_project(project_id))',tab);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(project_id)',tab||'_project_lookup',tab);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(user_id)',tab||'_user_lookup',tab);
  END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS projects_user_lookup ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS users_parent_lookup ON public.users(parent_user_id);
CREATE INDEX IF NOT EXISTS vendor_payments_expense_lookup ON public.vendor_payments(expense_id);
-- Reviewed against the hosted schema: preserve the existing relationships and
-- every row, but make parent deletion fail instead of deleting financial data.
-- Also install links missing from legacy tables (notably payments.user_id).
-- Do not rewrite an unexpected reference or an unreviewed cascading relation.
DO $$
DECLARE link record; fk record; child_oid oid; parent_oid oid;
  child_att smallint; parent_att smallint; found_link boolean;
BEGIN
  FOR link IN SELECT * FROM (VALUES
    ('users','parent_user_id','users'),
    ('projects','user_id','users'),
    ('expenses','project_id','projects'),('expenses','user_id','users'),
    ('payments','project_id','projects'),('payments','user_id','users'),
    ('customer_payments','project_id','projects'),('customer_payments','user_id','users'),
    ('vendor_payments','expense_id','expenses'),('vendor_payments','project_id','projects'),('vendor_payments','user_id','users')
  ) AS expected(child_table,child_column,parent_table) LOOP
    child_oid := format('public.%I',link.child_table)::regclass;
    parent_oid := format('public.%I',link.parent_table)::regclass;
    SELECT attnum INTO STRICT child_att FROM pg_attribute WHERE attrelid=child_oid AND attname=link.child_column AND NOT attisdropped;
    SELECT attnum INTO STRICT parent_att FROM pg_attribute WHERE attrelid=parent_oid AND attname='id' AND NOT attisdropped;
    found_link := false;
    FOR fk IN SELECT * FROM pg_constraint WHERE contype='f' AND conrelid=child_oid AND conkey=ARRAY[child_att] LOOP
      IF fk.confrelid<>parent_oid OR fk.confkey<>ARRAY[parent_att] OR fk.confdeltype NOT IN ('a','r','c') THEN
        RAISE EXCEPTION 'Review unexpected foreign key % on %.%',fk.conname,link.child_table,link.child_column;
      END IF;
      found_link := true;
      IF fk.confdeltype='c' THEN
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I, ADD CONSTRAINT %I %s',
          link.child_table,fk.conname,fk.conname,replace(pg_get_constraintdef(fk.oid),'ON DELETE CASCADE','ON DELETE NO ACTION'));
      END IF;
      -- Validate retained NOT VALID links too; legacy orphans must stop rollout.
      EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I',link.child_table,fk.conname);
    END LOOP;
    IF NOT found_link THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id)',
        link.child_table,link.child_table||'_'||link.child_column||'_workspace_fkey',link.child_column,link.parent_table);
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE contype='f' AND confdeltype='c' AND conrelid IN ('public.users'::regclass,'public.projects'::regclass,'public.expenses'::regclass,'public.payments'::regclass,'public.customer_payments'::regclass,'public.vendor_payments'::regclass)) THEN
    RAISE EXCEPTION 'Review cascading financial foreign keys on a staging clone before continuing';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION private.protect_record() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('service_role','postgres') THEN RETURN NEW; END IF;
  -- RLS still enforces workspace access; this trigger prevents forged creator IDs.
  IF TG_OP='INSERT' AND NEW.user_id IS DISTINCT FROM private.current_profile_id() THEN RAISE EXCEPTION 'Invalid creator' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN RAISE EXCEPTION 'Record identity is immutable' USING ERRCODE='42501'; END IF;
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.check_vendor_balance() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE expense_total numeric; paid numeric;
BEGIN
  -- The parent row lock serializes concurrent payments for the same expense.
  SELECT amount INTO expense_total FROM public.expenses WHERE id=NEW.expense_id AND project_id=NEW.project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expense and project do not match'; END IF;
  SELECT coalesce(sum(amount),0) INTO paid FROM public.vendor_payments WHERE expense_id=NEW.expense_id AND id<>NEW.id;
  IF paid+NEW.amount>expense_total THEN RAISE EXCEPTION 'Payment exceeds the outstanding expense amount'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER vendor_balance BEFORE INSERT OR UPDATE ON public.vendor_payments FOR EACH ROW EXECUTE FUNCTION private.check_vendor_balance();
CREATE OR REPLACE FUNCTION private.check_expense_balance() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.amount < (SELECT coalesce(sum(amount),0) FROM public.vendor_payments WHERE expense_id=NEW.id) THEN RAISE EXCEPTION 'Expense amount is below payments already recorded'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER expense_balance BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION private.check_expense_balance();
REVOKE ALL ON FUNCTION private.protect_record(),private.check_vendor_balance(),private.check_expense_balance() FROM PUBLIC;
DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY['projects','expenses','payments','customer_payments','vendor_payments'] LOOP
    EXECUTE format('CREATE TRIGGER protect_record BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.protect_record()',tab);
  END LOOP;
END $$;

-- No cascading financial deletion: dependent rows must be reviewed and removed explicitly.
-- These views execute with the caller's permissions so totals obey RLS.
DROP VIEW IF EXISTS public.expense_payment_status;
CREATE OR REPLACE VIEW public.expense_payment_status WITH (security_invoker=true) AS
SELECT e.id expense_id,e.project_id,e.description expense_description,e.amount expense_amount,e.category,e.scope_of_work,e.expense_date,
  coalesce(v.total,0) total_paid, e.amount-coalesce(v.total,0) outstanding_amount,
  CASE WHEN coalesce(v.total,0)=0 THEN 'Unpaid' WHEN v.total<e.amount THEN 'Partial' ELSE 'Paid' END payment_status,
  coalesce(v.total,0)/e.amount*100 payment_progress_percentage, coalesce(v.count,0) payment_count
FROM public.expenses e LEFT JOIN (SELECT expense_id,sum(amount) total,count(*) count FROM public.vendor_payments GROUP BY expense_id) v ON v.expense_id=e.id;
DROP VIEW IF EXISTS public.project_payment_summary;
CREATE OR REPLACE VIEW public.project_payment_summary WITH (security_invoker=true) AS
SELECT p.id project_id,p.name project_name,p.client_name,p.total_project_cost,
  coalesce(c.total,0)+coalesce(r.total,0) total_received,coalesce(e.total,0) total_expenses,coalesce(v.total,0) total_paid_to_vendors,
  coalesce(c.count,0)+coalesce(r.count,0) payment_count,
  coalesce(p.total_project_cost,0)-coalesce(c.total,0)-coalesce(r.total,0) outstanding_from_customer,
  coalesce(e.total,0)-coalesce(v.total,0) outstanding_to_vendors,
  CASE WHEN p.total_project_cost IS NULL OR p.total_project_cost=0 THEN 'Not Set' WHEN coalesce(c.total,0)+coalesce(r.total,0)=0 THEN 'Unpaid' WHEN coalesce(c.total,0)+coalesce(r.total,0)<p.total_project_cost THEN 'Partial' ELSE 'Paid' END payment_status,
  CASE WHEN p.total_project_cost>0 THEN (coalesce(c.total,0)+coalesce(r.total,0))/p.total_project_cost*100 ELSE 0 END payment_progress_percentage
FROM public.projects p
LEFT JOIN (SELECT project_id,sum(amount) total,count(*) count FROM public.customer_payments GROUP BY project_id) c ON c.project_id=p.id
LEFT JOIN (SELECT project_id,sum(amount) total,count(*) count FROM public.payments GROUP BY project_id) r ON r.project_id=p.id
LEFT JOIN (SELECT project_id,sum(amount) total FROM public.expenses GROUP BY project_id) e ON e.project_id=p.id
LEFT JOIN (SELECT project_id,sum(amount) total FROM public.vendor_payments GROUP BY project_id) v ON v.project_id=p.id;
REVOKE ALL ON public.project_payment_summary,public.expense_payment_status FROM PUBLIC,anon;
GRANT SELECT ON public.project_payment_summary,public.expense_payment_status TO authenticated,service_role;

-- Legacy reports otherwise execute as their owner and bypass table RLS.
-- Follow dependencies across schemas and through nested views. Preserve their
-- definitions and existing authenticated grants while removing anonymous access.
DO $$ DECLARE report record; col record; BEGIN
  FOR report IN
    WITH RECURSIVE dependent_relations(oid) AS (
      SELECT unnest(ARRAY['public.users'::regclass::oid,'public.projects'::regclass::oid,'public.expenses'::regclass::oid,
        'public.payments'::regclass::oid,'public.customer_payments'::regclass::oid,'public.vendor_payments'::regclass::oid])
      UNION
      SELECT rewrite.ev_class FROM pg_depend dependency
      JOIN pg_rewrite rewrite ON rewrite.oid=dependency.objid
      JOIN dependent_relations source ON source.oid=dependency.refobjid
      WHERE dependency.classid='pg_rewrite'::regclass AND dependency.refclassid='pg_class'::regclass
        AND rewrite.ev_class<>dependency.refobjid
    )
    SELECT c.oid,c.relkind,n.nspname,c.relname FROM dependent_relations d
    JOIN pg_class c ON c.oid=d.oid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('v','m')
  LOOP
    IF report.relkind='m' THEN
      RAISE EXCEPTION 'Review materialized report %.% before enabling workspace access',report.nspname,report.relname;
    END IF;
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker=true)',report.nspname,report.relname);
    EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC,anon',report.nspname,report.relname);
    FOR col IN SELECT attname FROM pg_attribute WHERE attrelid=report.oid AND attnum>0 AND NOT attisdropped LOOP
      EXECUTE format('REVOKE ALL (%I) ON %I.%I FROM PUBLIC,anon',col.attname,report.nspname,report.relname);
    END LOOP;
  END LOOP;
END $$;
COMMIT;
