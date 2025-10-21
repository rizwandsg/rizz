-- =====================================================
-- COMPREHENSIVE SCHEMA UPDATE
-- Run this script in Supabase SQL Editor
-- Adds vendor and payment tracking to expenses
-- =====================================================

-- =====================================================
-- STEP 1: Add columns to expenses table
-- =====================================================

-- Add vendor_name column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'vendor_name'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN vendor_name VARCHAR(255);
        RAISE NOTICE '✓ Added vendor_name column to expenses';
    ELSE
        RAISE NOTICE 'ℹ vendor_name column already exists in expenses';
    END IF;
END $$;

-- Add vendor_contact column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'vendor_contact'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN vendor_contact VARCHAR(50);
        RAISE NOTICE '✓ Added vendor_contact column to expenses';
    ELSE
        RAISE NOTICE 'ℹ vendor_contact column already exists in expenses';
    END IF;
END $$;

-- Add payment_method column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
        RAISE NOTICE '✓ Added payment_method column to expenses';
    ELSE
        RAISE NOTICE 'ℹ payment_method column already exists in expenses';
    END IF;
END $$;

-- Add payment_status column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN payment_status VARCHAR(20) DEFAULT 'Unpaid';
        RAISE NOTICE '✓ Added payment_status column to expenses';
    ELSE
        RAISE NOTICE 'ℹ payment_status column already exists in expenses';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_expenses_vendor_name ON public.expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON public.expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON public.expenses(payment_status);

DO $$ 
BEGIN
    RAISE NOTICE '✓ Indexes created successfully';
END $$;

-- =====================================================
-- STEP 3: Create database views
-- =====================================================

-- View: Expenses grouped by vendor
CREATE OR REPLACE VIEW public.expenses_by_vendor AS
SELECT 
    vendor_name,
    COUNT(*) AS expense_count,
    SUM(amount) AS total_amount,
    COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) AS paid_count,
    COUNT(CASE WHEN payment_status = 'Unpaid' THEN 1 END) AS unpaid_count,
    COUNT(CASE WHEN payment_status = 'Partial' THEN 1 END) AS partial_count,
    SUM(CASE WHEN payment_status = 'Paid' THEN amount ELSE 0 END) AS paid_amount,
    SUM(CASE WHEN payment_status = 'Unpaid' THEN amount ELSE 0 END) AS unpaid_amount
FROM public.expenses
WHERE vendor_name IS NOT NULL AND vendor_name != ''
GROUP BY vendor_name
ORDER BY total_amount DESC;

DO $$ 
BEGIN
    RAISE NOTICE '✓ expenses_by_vendor view created';
END $$;

-- View: Expenses by payment method
CREATE OR REPLACE VIEW public.expenses_by_payment_method AS
SELECT 
    payment_method,
    COUNT(*) AS expense_count,
    SUM(amount) AS total_amount,
    COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) AS paid_count,
    COUNT(CASE WHEN payment_status = 'Unpaid' THEN 1 END) AS unpaid_count
FROM public.expenses
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY total_amount DESC;

DO $$ 
BEGIN
    RAISE NOTICE '✓ expenses_by_payment_method view created';
END $$;

-- =====================================================
-- STEP 4: Create helper function
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_unique_vendors()
RETURNS TABLE (
    vendor_name VARCHAR,
    vendor_contact VARCHAR,
    last_used TIMESTAMP,
    total_expenses BIGINT,
    total_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (e.vendor_name)
        e.vendor_name,
        e.vendor_contact,
        MAX(e.created_at) AS last_used,
        COUNT(*)::BIGINT AS total_expenses,
        SUM(e.amount) AS total_amount
    FROM public.expenses e
    WHERE e.vendor_name IS NOT NULL AND e.vendor_name != ''
    GROUP BY e.vendor_name, e.vendor_contact
    ORDER BY e.vendor_name, MAX(e.created_at) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

DO $$ 
BEGIN
    RAISE NOTICE '✓ get_unique_vendors() function created';
END $$;

-- =====================================================
-- STEP 5: Verification
-- =====================================================

DO $$ 
DECLARE
    vendor_name_exists BOOLEAN;
    vendor_contact_exists BOOLEAN;
    payment_method_exists BOOLEAN;
    payment_status_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SCHEMA VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Check vendor_name
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'vendor_name'
    ) INTO vendor_name_exists;
    
    IF vendor_name_exists THEN
        RAISE NOTICE '✓ vendor_name column exists';
    ELSE
        RAISE NOTICE '✗ vendor_name column NOT found - MIGRATION FAILED!';
    END IF;
    
    -- Check vendor_contact
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'vendor_contact'
    ) INTO vendor_contact_exists;
    
    IF vendor_contact_exists THEN
        RAISE NOTICE '✓ vendor_contact column exists';
    ELSE
        RAISE NOTICE '✗ vendor_contact column NOT found - MIGRATION FAILED!';
    END IF;
    
    -- Check payment_method
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'payment_method'
    ) INTO payment_method_exists;
    
    IF payment_method_exists THEN
        RAISE NOTICE '✓ payment_method column exists';
    ELSE
        RAISE NOTICE '✗ payment_method column NOT found - MIGRATION FAILED!';
    END IF;
    
    -- Check payment_status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'payment_status'
    ) INTO payment_status_exists;
    
    IF payment_status_exists THEN
        RAISE NOTICE '✓ payment_status column exists';
    ELSE
        RAISE NOTICE '✗ payment_status column NOT found - MIGRATION FAILED!';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check views
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'expenses_by_vendor'
    ) THEN
        RAISE NOTICE '✓ expenses_by_vendor view exists';
    ELSE
        RAISE NOTICE '✗ expenses_by_vendor view NOT found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'expenses_by_payment_method'
    ) THEN
        RAISE NOTICE '✓ expenses_by_payment_method view exists';
    ELSE
        RAISE NOTICE '✗ expenses_by_payment_method view NOT found';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
    RAISE NOTICE '';
    
    -- Summary
    IF vendor_name_exists AND vendor_contact_exists AND payment_method_exists AND payment_status_exists THEN
        RAISE NOTICE '🎉 SUCCESS! All columns added successfully.';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Restart your Expo app to clear cache';
        RAISE NOTICE '2. Try creating an expense again';
    ELSE
        RAISE NOTICE '❌ MIGRATION INCOMPLETE - Please check errors above';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 6: Display current schema
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'expenses'
ORDER BY ordinal_position;
