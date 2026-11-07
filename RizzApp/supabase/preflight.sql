-- Read-only diagnostics. Run on a sanitized staging clone before migrating.
SELECT 'projects_without_owner' issue,count(*) FROM public.projects WHERE user_id IS NULL
UNION ALL SELECT 'expenses_without_owner',count(*) FROM public.expenses WHERE user_id IS NULL
UNION ALL SELECT 'expenses_without_project',count(*) FROM public.expenses WHERE project_id IS NULL
UNION ALL SELECT 'invalid_expense_amount',count(*) FROM public.expenses WHERE NOT(amount>0 AND amount<=9999999999.99 AND amount=round(amount,2))
UNION ALL SELECT 'reversed_project_dates',count(*) FROM public.projects WHERE end_date<start_date;
SELECT lower(email),count(*) FROM public.users GROUP BY lower(email) HAVING count(*)>1;
SELECT conrelid::regclass AS child,conname,pg_get_constraintdef(oid) definition
FROM pg_constraint WHERE contype='f' AND confdeltype='c' AND connamespace='public'::regnamespace;
SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public';
SELECT table_name,column_name,data_type FROM information_schema.columns
WHERE table_schema='public' ORDER BY table_name,ordinal_position;

-- BEGIN REALTIME DELETE SAFETY CHECK
-- Read-only: report every publication carrying private financial/account tables.
-- Realtime DELETE events do not enforce row-level security. Removing an app
-- listener does not prevent another client from subscribing directly.
-- https://supabase.com/docs/guides/realtime/postgres-changes#receiving-old-records
SELECT p.pubname AS publication, t.schemaname, t.tablename,
       p.pubinsert, p.pubupdate, p.pubdelete, p.pubtruncate,
       CASE WHEN p.pubdelete THEN 'REVIEW: deleted record identifiers may bypass workspace RLS'
            ELSE 'No DELETE events in this publication' END AS finding
FROM pg_publication AS p
JOIN pg_publication_tables AS t ON t.pubname=p.pubname
WHERE t.schemaname='public'
  AND t.tablename IN ('users','projects','expenses','payments','customer_payments','vendor_payments')
ORDER BY p.pubname,t.tablename;

-- A failing check changes nothing. Do not resume release by suppressing it.
-- Review custom Realtime publication names in the result above as well.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication AS p
    JOIN pg_publication_tables AS t ON t.pubname=p.pubname
    WHERE p.pubname='supabase_realtime' AND p.pubdelete
      AND t.schemaname='public'
      AND t.tablename IN ('users','projects','expenses','payments','customer_payments','vendor_payments')
  ) THEN
    RAISE EXCEPTION 'Unsafe Realtime DELETE publication. Stop release and review publication settings or private authorized Broadcast before continuing.';
  END IF;
END;
$$;
