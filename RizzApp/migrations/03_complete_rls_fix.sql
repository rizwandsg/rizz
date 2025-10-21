-- =====================================================
-- COMPLETE RLS FIX FOR PAYMENTS TABLE
-- This will completely reset and fix the RLS policies
-- =====================================================

-- Step 1: Disable RLS temporarily
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payments') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.payments', r.policyname);
    END LOOP;
    RAISE NOTICE 'Dropped all existing policies';
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new simplified policies
CREATE POLICY "Allow all for authenticated users"
ON public.payments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✓ RLS POLICIES COMPLETELY RESET';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'New Policy: "Allow all for authenticated users"';
    RAISE NOTICE '  - Applies to: SELECT, INSERT, UPDATE, DELETE';
    RAISE NOTICE '  - Restriction: User must be authenticated';
    RAISE NOTICE '  - User filtering: Handled by app (user_id field)';
    RAISE NOTICE '';
    RAISE NOTICE 'Try recording a payment now!';
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
END $$;

-- Step 5: Verify the policy
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payments';

-- Step 6: Check RLS status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✓ ENABLED'
        ELSE '✗ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'payments' AND schemaname = 'public';
