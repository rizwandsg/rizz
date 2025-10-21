-- =====================================================
-- PAYMENTS TABLE MIGRATION (SAFE VERSION)
-- Run this script in Supabase SQL Editor
-- Handles existing objects safely
-- =====================================================

-- =====================================================
-- STEP 1: Drop existing views first (to avoid conflicts)
-- =====================================================

DROP VIEW IF EXISTS public.payments_with_project CASCADE;
DROP VIEW IF EXISTS public.project_payment_summary CASCADE;

DO $$ 
BEGIN
    RAISE NOTICE '✓ Cleaned up existing views';
END $$;

-- =====================================================
-- STEP 2: Create payments table (or skip if exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    payment_date DATE NOT NULL,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'Other',
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'Cash',
    reference_number VARCHAR(100),
    notes TEXT,
    received_from VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
    ) THEN
        RAISE NOTICE '✓ payments table exists';
    ELSE
        RAISE NOTICE '✗ Failed to create payments table';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);

DO $$ 
BEGIN
    RAISE NOTICE '✓ Payment indexes created';
END $$;

-- =====================================================
-- STEP 4: Create or replace updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DO $$ 
BEGIN
    RAISE NOTICE '✓ updated_at trigger created';
END $$;

-- =====================================================
-- STEP 5: Create view for payment summaries
-- =====================================================

CREATE OR REPLACE VIEW public.project_payment_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.total_project_cost,
    COALESCE(SUM(pay.amount), 0) AS total_received,
    p.total_project_cost - COALESCE(SUM(pay.amount), 0) AS remaining_amount,
    COUNT(pay.id) AS payment_count,
    MAX(pay.payment_date) AS last_payment_date
FROM public.projects p
LEFT JOIN public.payments pay ON p.id = pay.project_id
GROUP BY p.id, p.name, p.total_project_cost;

DO $$ 
BEGIN
    RAISE NOTICE '✓ project_payment_summary view created';
END $$;

-- =====================================================
-- STEP 6: Create view for payment details
-- =====================================================

CREATE OR REPLACE VIEW public.payments_with_project AS
SELECT 
    pay.*,
    proj.name AS project_name,
    proj.client_name,
    proj.total_project_cost
FROM public.payments pay
LEFT JOIN public.projects proj ON pay.project_id = proj.id;

DO $$ 
BEGIN
    RAISE NOTICE '✓ payments_with_project view created';
END $$;

-- =====================================================
-- STEP 7: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;

-- Create policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON public.payments
    FOR DELETE
    USING (auth.uid() = user_id);

DO $$ 
BEGIN
    RAISE NOTICE '✓ Row Level Security policies created';
END $$;

-- =====================================================
-- STEP 8: Final Verification
-- =====================================================

DO $$ 
DECLARE
    table_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '       PAYMENTS TABLE VERIFICATION';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
    
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✓ payments table exists';
    ELSE
        RAISE NOTICE '✗ payments table NOT found';
    END IF;
    
    -- Check RLS
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'payments' AND relnamespace = 'public'::regnamespace;
    
    IF rls_enabled THEN
        RAISE NOTICE '✓ Row Level Security is ENABLED';
    ELSE
        RAISE NOTICE '✗ Row Level Security NOT enabled';
    END IF;
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'payments';
    
    RAISE NOTICE '✓ Found % RLS policies', policy_count;
    
    -- Check views
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'project_payment_summary'
    ) THEN
        RAISE NOTICE '✓ project_payment_summary view exists';
    ELSE
        RAISE NOTICE '✗ project_payment_summary view NOT found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'payments_with_project'
    ) THEN
        RAISE NOTICE '✓ payments_with_project view exists';
    ELSE
        RAISE NOTICE '✗ payments_with_project view NOT found';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    
    IF table_exists AND rls_enabled AND policy_count >= 4 THEN
        RAISE NOTICE '🎉 SUCCESS! Migration completed successfully!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Restart your Expo app: npx expo start --clear';
        RAISE NOTICE '2. Open any project';
        RAISE NOTICE '3. Start recording payments!';
    ELSE
        RAISE NOTICE '⚠️  MIGRATION INCOMPLETE - Check errors above';
    END IF;
    
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 9: Display table schema
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'payments'
ORDER BY ordinal_position;
