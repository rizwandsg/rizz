-- =====================================================
-- STEP 1: DROP CONFLICTING VIEWS FIRST
-- Run this FIRST to clean up
-- =====================================================

DROP VIEW IF EXISTS public.payments_with_project CASCADE;
DROP VIEW IF EXISTS public.project_payment_summary CASCADE;

-- If you have any other payment-related views, add them here:
-- DROP VIEW IF EXISTS public.your_other_view CASCADE;

DO $$ 
BEGIN
    RAISE NOTICE '✓ Dropped all conflicting views';
    RAISE NOTICE '';
    RAISE NOTICE 'Now run: create_payments_table.sql';
END $$;
