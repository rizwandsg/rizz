-- =====================================================
-- ADD VENDOR AND PAYMENT METHOD TO EXPENSES
-- This migration adds vendor/supplier and payment tracking to expenses
-- =====================================================

-- Add vendor and payment columns to expenses table
DO $$ 
BEGIN
    -- Add vendor_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'vendor_name'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN vendor_name VARCHAR(255);
        RAISE NOTICE 'Added vendor_name column to expenses';
    ELSE
        RAISE NOTICE 'vendor_name column already exists in expenses';
    END IF;

    -- Add vendor_contact
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'vendor_contact'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN vendor_contact VARCHAR(50);
        RAISE NOTICE 'Added vendor_contact column to expenses';
    ELSE
        RAISE NOTICE 'vendor_contact column already exists in expenses';
    END IF;

    -- Add payment_method
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
        RAISE NOTICE 'Added payment_method column to expenses';
    ELSE
        RAISE NOTICE 'payment_method column already exists in expenses';
    END IF;

    -- Add payment_status (Paid/Unpaid/Partial)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN payment_status VARCHAR(20) DEFAULT 'Unpaid';
        RAISE NOTICE 'Added payment_status column to expenses';
    ELSE
        RAISE NOTICE 'payment_status column already exists in expenses';
    END IF;
END $$;

-- Create index on vendor_name for faster searches
CREATE INDEX IF NOT EXISTS idx_expenses_vendor_name ON public.expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON public.expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON public.expenses(payment_status);

-- =====================================================
-- VIEW: Expenses grouped by vendor
-- =====================================================
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

-- =====================================================
-- VIEW: Expenses by payment method
-- =====================================================
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

-- =====================================================
-- FUNCTION: Get unique vendors list
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

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '=== VENDOR & PAYMENT METHOD SCHEMA VERIFICATION ===';
    
    -- Check vendor_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'vendor_name'
    ) THEN
        RAISE NOTICE '✓ vendor_name column exists';
    ELSE
        RAISE NOTICE '✗ vendor_name column NOT found';
    END IF;
    
    -- Check vendor_contact
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'vendor_contact'
    ) THEN
        RAISE NOTICE '✓ vendor_contact column exists';
    ELSE
        RAISE NOTICE '✗ vendor_contact column NOT found';
    END IF;
    
    -- Check payment_method
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'payment_method'
    ) THEN
        RAISE NOTICE '✓ payment_method column exists';
    ELSE
        RAISE NOTICE '✗ payment_method column NOT found';
    END IF;
    
    -- Check payment_status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'expenses' 
        AND column_name = 'payment_status'
    ) THEN
        RAISE NOTICE '✓ payment_status column exists';
    ELSE
        RAISE NOTICE '✗ payment_status column NOT found';
    END IF;
    
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
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;

-- Show current expenses columns
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'expenses'
ORDER BY ordinal_position;
