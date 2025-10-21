-- =====================================================
-- PAYMENT TRACKING SYSTEM
-- This migration adds customer payments and vendor payments tracking
-- =====================================================

-- =====================================================
-- TABLE 1: Customer Payments (Money received from clients)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Payment details
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    -- Payment methods: Cash, Check, Bank Transfer, UPI, Card, Other
    
    -- Reference information
    reference_number VARCHAR(100), -- Check number, transaction ID, etc.
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 2: Vendor Payments (Money paid to vendors/suppliers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vendor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Payment details
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    
    -- Vendor information
    vendor_name VARCHAR(255) NOT NULL,
    vendor_contact VARCHAR(50),
    
    -- Reference information
    reference_number VARCHAR(100), -- Check number, transaction ID, invoice number, etc.
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customer_payments_project ON public.customer_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON public.customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customer_payments_user ON public.customer_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_expense ON public.vendor_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_project ON public.vendor_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON public.vendor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_user ON public.vendor_payments(user_id);

-- =====================================================
-- VIEW 1: Project Payment Summary
-- =====================================================
CREATE OR REPLACE VIEW public.project_payment_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.client_name,
    p.total_project_cost,
    
    -- Customer payments (money IN)
    COALESCE(SUM(cp.amount), 0) AS total_received,
    
    -- Total expenses
    COALESCE(
        (SELECT SUM(e.amount) 
         FROM public.expenses e 
         WHERE e.project_id = p.id), 
        0
    ) AS total_expenses,
    
    -- Vendor payments (money OUT)
    COALESCE(
        (SELECT SUM(vp.amount) 
         FROM public.vendor_payments vp 
         WHERE vp.project_id = p.id), 
        0
    ) AS total_paid_to_vendors,
    
    -- Outstanding from customer
    COALESCE(p.total_project_cost, 0) - COALESCE(SUM(cp.amount), 0) AS outstanding_from_customer,
    
    -- Outstanding to vendors (expenses not yet paid)
    COALESCE(
        (SELECT SUM(e.amount) 
         FROM public.expenses e 
         WHERE e.project_id = p.id), 
        0
    ) - COALESCE(
        (SELECT SUM(vp.amount) 
         FROM public.vendor_payments vp 
         WHERE vp.project_id = p.id), 
        0
    ) AS outstanding_to_vendors,
    
    -- Payment status
    CASE 
        WHEN p.total_project_cost IS NULL THEN 'Not Set'
        WHEN COALESCE(SUM(cp.amount), 0) = 0 THEN 'Unpaid'
        WHEN COALESCE(SUM(cp.amount), 0) < p.total_project_cost THEN 'Partial'
        WHEN COALESCE(SUM(cp.amount), 0) >= p.total_project_cost THEN 'Paid'
        ELSE 'Unknown'
    END AS payment_status,
    
    -- Payment progress percentage
    CASE 
        WHEN p.total_project_cost > 0 THEN 
            ROUND((COALESCE(SUM(cp.amount), 0) / p.total_project_cost * 100)::numeric, 2)
        ELSE 0
    END AS payment_progress_percentage

FROM public.projects p
LEFT JOIN public.customer_payments cp ON cp.project_id = p.id
GROUP BY p.id, p.name, p.client_name, p.total_project_cost;

-- =====================================================
-- VIEW 2: Expense Payment Status
-- =====================================================
CREATE OR REPLACE VIEW public.expense_payment_status AS
SELECT 
    e.id AS expense_id,
    e.project_id,
    e.description AS expense_description,
    e.amount AS expense_amount,
    e.category,
    e.scope_of_work,
    e.expense_date,
    
    -- Vendor payments for this expense
    COALESCE(SUM(vp.amount), 0) AS total_paid,
    e.amount - COALESCE(SUM(vp.amount), 0) AS outstanding_amount,
    
    -- Payment status
    CASE 
        WHEN COALESCE(SUM(vp.amount), 0) = 0 THEN 'Unpaid'
        WHEN COALESCE(SUM(vp.amount), 0) < e.amount THEN 'Partial'
        WHEN COALESCE(SUM(vp.amount), 0) >= e.amount THEN 'Paid'
        ELSE 'Unknown'
    END AS payment_status,
    
    -- Payment progress percentage
    CASE 
        WHEN e.amount > 0 THEN 
            ROUND((COALESCE(SUM(vp.amount), 0) / e.amount * 100)::numeric, 2)
        ELSE 0
    END AS payment_progress_percentage,
    
    -- Payment count
    COUNT(vp.id) AS payment_count

FROM public.expenses e
LEFT JOIN public.vendor_payments vp ON vp.expense_id = e.id
GROUP BY e.id, e.project_id, e.description, e.amount, e.category, e.scope_of_work, e.expense_date;

-- =====================================================
-- VIEW 3: Payment Timeline (All payments chronologically)
-- =====================================================
CREATE OR REPLACE VIEW public.payment_timeline AS
SELECT 
    cp.id,
    cp.project_id,
    'Customer Payment' AS payment_type,
    cp.amount,
    cp.payment_date,
    cp.payment_method,
    cp.reference_number,
    cp.notes,
    NULL AS vendor_name,
    NULL AS expense_id,
    cp.created_at
FROM public.customer_payments cp

UNION ALL

SELECT 
    vp.id,
    vp.project_id,
    'Vendor Payment' AS payment_type,
    vp.amount,
    vp.payment_date,
    vp.payment_method,
    vp.reference_number,
    vp.notes,
    vp.vendor_name,
    vp.expense_id,
    vp.created_at
FROM public.vendor_payments vp

ORDER BY payment_date DESC, created_at DESC;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: Customer Payments
-- =====================================================

-- Policy: Users can view their own customer payments
DROP POLICY IF EXISTS "Users can view their own customer payments" ON public.customer_payments;
CREATE POLICY "Users can view their own customer payments"
    ON public.customer_payments FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own customer payments
DROP POLICY IF EXISTS "Users can insert their own customer payments" ON public.customer_payments;
CREATE POLICY "Users can insert their own customer payments"
    ON public.customer_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own customer payments
DROP POLICY IF EXISTS "Users can update their own customer payments" ON public.customer_payments;
CREATE POLICY "Users can update their own customer payments"
    ON public.customer_payments FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own customer payments
DROP POLICY IF EXISTS "Users can delete their own customer payments" ON public.customer_payments;
CREATE POLICY "Users can delete their own customer payments"
    ON public.customer_payments FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: Vendor Payments
-- =====================================================

-- Policy: Users can view their own vendor payments
DROP POLICY IF EXISTS "Users can view their own vendor payments" ON public.vendor_payments;
CREATE POLICY "Users can view their own vendor payments"
    ON public.vendor_payments FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own vendor payments
DROP POLICY IF EXISTS "Users can insert their own vendor payments" ON public.vendor_payments;
CREATE POLICY "Users can insert their own vendor payments"
    ON public.vendor_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vendor payments
DROP POLICY IF EXISTS "Users can update their own vendor payments" ON public.vendor_payments;
CREATE POLICY "Users can update their own vendor payments"
    ON public.vendor_payments FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own vendor payments
DROP POLICY IF EXISTS "Users can delete their own vendor payments" ON public.vendor_payments;
CREATE POLICY "Users can delete their own vendor payments"
    ON public.vendor_payments FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables created
DO $$ 
BEGIN
    RAISE NOTICE '=== PAYMENT TRACKING SCHEMA VERIFICATION ===';
    
    -- Check customer_payments
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'customer_payments'
    ) THEN
        RAISE NOTICE '✓ customer_payments table exists';
    ELSE
        RAISE NOTICE '✗ customer_payments table NOT found';
    END IF;
    
    -- Check vendor_payments
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'vendor_payments'
    ) THEN
        RAISE NOTICE '✓ vendor_payments table exists';
    ELSE
        RAISE NOTICE '✗ vendor_payments table NOT found';
    END IF;
    
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
        WHERE table_schema = 'public' AND table_name = 'expense_payment_status'
    ) THEN
        RAISE NOTICE '✓ expense_payment_status view exists';
    ELSE
        RAISE NOTICE '✗ expense_payment_status view NOT found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'payment_timeline'
    ) THEN
        RAISE NOTICE '✓ payment_timeline view exists';
    ELSE
        RAISE NOTICE '✗ payment_timeline view NOT found';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;
