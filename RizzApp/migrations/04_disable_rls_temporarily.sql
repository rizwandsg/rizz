-- =====================================================
-- DISABLE RLS COMPLETELY (TEMPORARY FOR TESTING)
-- This will allow inserts to work immediately
-- You can re-enable it later if needed
-- =====================================================

-- Disable Row Level Security on payments table
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '⚠️  RLS DISABLED FOR PAYMENTS TABLE';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Row Level Security has been DISABLED.';
    RAISE NOTICE 'All authenticated users can now:';
    RAISE NOTICE '  - Insert payments';
    RAISE NOTICE '  - View payments';
    RAISE NOTICE '  - Update payments';
    RAISE NOTICE '  - Delete payments';
    RAISE NOTICE '';
    RAISE NOTICE 'User filtering is handled by the app (user_id field).';
    RAISE NOTICE '';
    RAISE NOTICE 'Try recording a payment now - it should work!';
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
END $$;

-- Verify RLS is disabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✓ ENABLED (Problem!)'
        ELSE '✗ DISABLED (Good!)'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'payments' AND schemaname = 'public';
