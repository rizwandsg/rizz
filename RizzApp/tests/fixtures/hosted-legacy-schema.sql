-- Schema-only fixture from the hosted application, inspected 2026-11-07.
-- Contains no customer rows, identifiers, credentials, or account details.
-- UUID defaults use built-in gen_random_uuid for the local PostgreSQL engine.
CREATE TABLE public.customer_payments (id uuid DEFAULT gen_random_uuid() NOT NULL,
project_id uuid NOT NULL,
user_id uuid NOT NULL,
amount numeric(15,2) NOT NULL,
payment_date date DEFAULT CURRENT_DATE NOT NULL,
payment_method character varying(50) DEFAULT 'Cash'::character varying NOT NULL,
reference_number character varying(100),
notes text,
created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE public.expenses (id uuid DEFAULT gen_random_uuid() NOT NULL,
project_id uuid,
user_id uuid,
amount numeric(15,2) NOT NULL,
description text NOT NULL,
category character varying(100),
expense_date date NOT NULL,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
scope_of_work text,
vendor_name character varying(255),
vendor_contact character varying(50),
payment_method character varying(50) DEFAULT 'Cash'::character varying,
payment_status character varying(20) DEFAULT 'Unpaid'::character varying);

CREATE TABLE public.payments (id uuid DEFAULT gen_random_uuid() NOT NULL,
project_id uuid NOT NULL,
user_id uuid NOT NULL,
amount numeric NOT NULL,
payment_date date NOT NULL,
payment_type character varying(20) DEFAULT 'Other'::character varying NOT NULL,
payment_mode character varying(50) DEFAULT 'Cash'::character varying NOT NULL,
reference_number character varying(100),
notes text,
received_from character varying(255),
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()));

CREATE TABLE public.projects (id uuid DEFAULT gen_random_uuid() NOT NULL,
user_id uuid,
name character varying(255) NOT NULL,
description text,
start_date date NOT NULL,
end_date date,
status character varying(50) DEFAULT 'active'::character varying,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
client_name character varying(255),
total_project_cost numeric(15,2),
scope_of_work text[]);

CREATE TABLE public.users (id uuid DEFAULT gen_random_uuid() NOT NULL,
email character varying(255) NOT NULL,
password_hash character varying(255),
full_name character varying(255) NOT NULL,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
last_login timestamp with time zone,
phone character varying(20),
parent_user_id uuid,
role character varying(20) DEFAULT 'owner'::character varying NOT NULL,
is_active boolean DEFAULT true NOT NULL,
clerk_user_id text);

CREATE TABLE public.vendor_payments (id uuid DEFAULT gen_random_uuid() NOT NULL,
expense_id uuid NOT NULL,
project_id uuid NOT NULL,
user_id uuid NOT NULL,
amount numeric(15,2) NOT NULL,
payment_date date DEFAULT CURRENT_DATE NOT NULL,
payment_method character varying(50) DEFAULT 'Cash'::character varying NOT NULL,
vendor_name character varying(255) NOT NULL,
vendor_contact character varying(50),
reference_number character varying(100),
notes text,
created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);

ALTER TABLE public.customer_payments ADD CONSTRAINT customer_payments_amount_check CHECK ((amount > (0)::numeric));

ALTER TABLE public.customer_payments ADD CONSTRAINT customer_payments_pkey PRIMARY KEY (id);

ALTER TABLE public.expenses ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);

ALTER TABLE public.payments ADD CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric));

ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE public.projects ADD CONSTRAINT check_valid_scope_of_work CHECK ((scope_of_work <@ ARRAY['Carpentry Work'::text, 'Painting Work'::text, 'Aluminium Work'::text, 'Electrical Work'::text, 'Plumbing Work'::text, 'Flooring Work'::text, 'False Ceiling Work'::text, 'Masonry Work'::text, 'Tiling Work'::text, 'Glazing Work'::text, 'Door & Window Work'::text, 'Kitchen & Modular Work'::text, 'Interior Decoration'::text, 'Exterior Decoration'::text, 'Landscaping Work'::text, 'HVAC Work'::text, 'Waterproofing Work'::text, 'Structural Work'::text, 'Civil Work'::text, 'Plastering Work'::text, 'Wallpaper Work'::text, 'Furniture Work'::text, 'Lighting Work'::text, 'Partition Work'::text, 'Plaster of Paris Work'::text, 'Wood Flooring'::text, 'Marble & Granite Work'::text, 'Steel Fabrication'::text, 'Railing Work'::text, 'Staircase Work'::text, 'Bathroom Fitting'::text, 'Wardrobe Work'::text, 'Curtain & Blinds'::text, 'Wall Cladding'::text, 'Roofing Work'::text, 'Insulation Work'::text, 'Demolition Work'::text, 'Site Preparation'::text, 'Traveling Expenses'::text, 'Complete Interior Fit-out'::text, 'Complete Renovation'::text, 'Turnkey Project'::text]));

ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE public.users ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);

ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'member'::character varying])::text[])));

ALTER TABLE public.vendor_payments ADD CONSTRAINT vendor_payments_amount_check CHECK ((amount > (0)::numeric));

ALTER TABLE public.vendor_payments ADD CONSTRAINT vendor_payments_pkey PRIMARY KEY (id);

ALTER TABLE public.customer_payments ADD CONSTRAINT customer_payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.customer_payments ADD CONSTRAINT customer_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.expenses ADD CONSTRAINT expenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.expenses ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.payments ADD CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.users ADD CONSTRAINT users_parent_user_id_fkey FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.vendor_payments ADD CONSTRAINT vendor_payments_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE;

ALTER TABLE public.vendor_payments ADD CONSTRAINT vendor_payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.vendor_payments ADD CONSTRAINT vendor_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE VIEW public.expense_by_scope AS  SELECT project_id,
    scope_of_work,
    category,
    count(*) AS expense_count,
    sum(amount) AS total_amount,
    avg(amount) AS avg_amount,
    min(expense_date) AS first_expense,
    max(expense_date) AS last_expense
   FROM expenses e
  WHERE scope_of_work IS NOT NULL
  GROUP BY project_id, scope_of_work, category;

CREATE VIEW public.expense_payment_status AS  SELECT e.id AS expense_id,
    e.project_id,
    e.description AS expense_description,
    e.amount AS expense_amount,
    e.category,
    e.scope_of_work,
    e.expense_date,
    COALESCE(sum(vp.amount), 0::numeric) AS total_paid,
    e.amount - COALESCE(sum(vp.amount), 0::numeric) AS outstanding_amount,
        CASE
            WHEN COALESCE(sum(vp.amount), 0::numeric) = 0::numeric THEN 'Unpaid'::text
            WHEN COALESCE(sum(vp.amount), 0::numeric) < e.amount THEN 'Partial'::text
            WHEN COALESCE(sum(vp.amount), 0::numeric) >= e.amount THEN 'Paid'::text
            ELSE 'Unknown'::text
        END AS payment_status,
        CASE
            WHEN e.amount > 0::numeric THEN round(COALESCE(sum(vp.amount), 0::numeric) / e.amount * 100::numeric, 2)
            ELSE 0::numeric
        END AS payment_progress_percentage,
    count(vp.id) AS payment_count
   FROM expenses e
     LEFT JOIN vendor_payments vp ON vp.expense_id = e.id
  GROUP BY e.id, e.project_id, e.description, e.amount, e.category, e.scope_of_work, e.expense_date;

CREATE VIEW public.expenses_by_payment_method AS  SELECT payment_method,
    count(*) AS expense_count,
    sum(amount) AS total_amount,
    count(
        CASE
            WHEN payment_status::text = 'Paid'::text THEN 1
            ELSE NULL::integer
        END) AS paid_count,
    count(
        CASE
            WHEN payment_status::text = 'Unpaid'::text THEN 1
            ELSE NULL::integer
        END) AS unpaid_count
   FROM expenses
  WHERE payment_method IS NOT NULL
  GROUP BY payment_method
  ORDER BY (sum(amount)) DESC;

CREATE VIEW public.expenses_by_vendor AS  SELECT vendor_name,
    count(*) AS expense_count,
    sum(amount) AS total_amount,
    count(
        CASE
            WHEN payment_status::text = 'Paid'::text THEN 1
            ELSE NULL::integer
        END) AS paid_count,
    count(
        CASE
            WHEN payment_status::text = 'Unpaid'::text THEN 1
            ELSE NULL::integer
        END) AS unpaid_count,
    count(
        CASE
            WHEN payment_status::text = 'Partial'::text THEN 1
            ELSE NULL::integer
        END) AS partial_count,
    sum(
        CASE
            WHEN payment_status::text = 'Paid'::text THEN amount
            ELSE 0::numeric
        END) AS paid_amount,
    sum(
        CASE
            WHEN payment_status::text = 'Unpaid'::text THEN amount
            ELSE 0::numeric
        END) AS unpaid_amount
   FROM expenses
  WHERE vendor_name IS NOT NULL AND vendor_name::text <> ''::text
  GROUP BY vendor_name
  ORDER BY (sum(amount)) DESC;

CREATE VIEW public.payment_timeline AS  SELECT cp.id,
    cp.project_id,
    'Customer Payment'::text AS payment_type,
    cp.amount,
    cp.payment_date,
    cp.payment_method,
    cp.reference_number,
    cp.notes,
    NULL::character varying AS vendor_name,
    NULL::uuid AS expense_id,
    cp.created_at
   FROM customer_payments cp
UNION ALL
 SELECT vp.id,
    vp.project_id,
    'Vendor Payment'::text AS payment_type,
    vp.amount,
    vp.payment_date,
    vp.payment_method,
    vp.reference_number,
    vp.notes,
    vp.vendor_name,
    vp.expense_id,
    vp.created_at
   FROM vendor_payments vp
  ORDER BY 5 DESC, 11 DESC;

CREATE VIEW public.payments_with_project AS  SELECT pay.id,
    pay.project_id,
    pay.user_id,
    pay.amount,
    pay.payment_date,
    pay.payment_type,
    pay.payment_mode,
    pay.reference_number,
    pay.notes,
    pay.received_from,
    pay.created_at,
    pay.updated_at,
    proj.name AS project_name,
    proj.client_name,
    proj.total_project_cost
   FROM payments pay
     LEFT JOIN projects proj ON pay.project_id = proj.id;

CREATE VIEW public.project_payment_summary AS  SELECT p.id AS project_id,
    p.name AS project_name,
    p.total_project_cost,
    COALESCE(sum(pay.amount), 0::numeric) AS total_received,
    p.total_project_cost - COALESCE(sum(pay.amount), 0::numeric) AS remaining_amount,
    count(pay.id) AS payment_count,
    max(pay.payment_date) AS last_payment_date
   FROM projects p
     LEFT JOIN payments pay ON p.id = pay.project_id
  GROUP BY p.id, p.name, p.total_project_cost;

CREATE VIEW public.project_scope_budget AS  SELECT p.id AS project_id,
    p.name AS project_name,
    p.total_project_cost,
    scope_item.scope_item AS scope,
    COALESCE(( SELECT sum(e.amount) AS sum
           FROM expenses e
          WHERE e.project_id = p.id AND e.scope_of_work = scope_item.scope_item), 0::numeric) AS scope_expenses,
    p.total_project_cost - COALESCE(( SELECT sum(e.amount) AS sum
           FROM expenses e
          WHERE e.project_id = p.id), 0::numeric) AS remaining_budget
   FROM projects p
     CROSS JOIN LATERAL unnest(p.scope_of_work) scope_item(scope_item)
  WHERE p.scope_of_work IS NOT NULL AND array_length(p.scope_of_work, 1) > 0;

CREATE VIEW public.user_team_summary AS  SELECT u.id AS owner_id,
    u.full_name AS owner_name,
    u.email AS owner_email,
    count(sub.id) AS total_members,
    count(sub.id) FILTER (WHERE sub.is_active = true) AS active_members,
    count(sub.id) FILTER (WHERE sub.is_active = false) AS inactive_members
   FROM users u
     LEFT JOIN users sub ON sub.parent_user_id = u.id
  WHERE u.role::text = 'owner'::text
  GROUP BY u.id, u.full_name, u.email;

CREATE VIEW public.users_with_parent AS  SELECT u.id,
    u.email,
    u.full_name,
    u.phone,
    u.role,
    u.is_active,
    u.parent_user_id,
    u.created_at,
    u.last_login,
    parent.full_name AS parent_name,
    parent.email AS parent_email
   FROM users u
     LEFT JOIN users parent ON u.parent_user_id = parent.id;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
