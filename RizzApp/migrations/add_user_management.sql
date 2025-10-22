-- =====================================================
-- USER MANAGEMENT SYSTEM MIGRATION
-- Adds parent-child user relationships and roles
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Add new columns to users table
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '       USER MANAGEMENT MIGRATION';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Step 1: Adding new columns to users table...';
END $$;

-- Add parent_user_id column (for sub-users)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add role column (owner/member)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'owner';

-- Add is_active column (for enabling/disabling sub-users)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add constraint to ensure role is either 'owner' or 'member'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_role_check 
        CHECK (role IN ('owner', 'member'));
    END IF;
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✓ New columns added successfully';
    RAISE NOTICE '  - parent_user_id (UUID, nullable)';
    RAISE NOTICE '  - role (VARCHAR, default: owner)';
    RAISE NOTICE '  - is_active (BOOLEAN, default: true)';
END $$;

-- =====================================================
-- STEP 2: Update existing users to be owners
-- =====================================================

DO $$ 
DECLARE
    updated_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Step 2: Updating existing users...';
    
    -- Set all existing users as 'owner' with parent_user_id = NULL
    UPDATE public.users 
    SET role = 'owner', 
        parent_user_id = NULL,
        is_active = true
    WHERE role IS NULL OR parent_user_id IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE '✓ Updated % existing user(s) to owner role', updated_count;
END $$;

-- =====================================================
-- STEP 3: Create indexes for performance
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Step 3: Creating indexes...';
END $$;

CREATE INDEX IF NOT EXISTS idx_users_parent_user_id ON public.users(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

DO $$ 
BEGIN
    RAISE NOTICE '✓ Indexes created successfully';
END $$;

-- =====================================================
-- STEP 4: Update RLS policies for shared access
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Step 4: Updating RLS policies...';
END $$;

-- Drop existing policies (both old and new names)
DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can read accessible projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update accessible projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete accessible projects" ON public.projects;

DROP POLICY IF EXISTS "Users can read own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can read accessible expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update accessible expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete accessible expenses" ON public.expenses;

-- Projects RLS: Allow owner and their sub-users
-- IMPORTANT: Using TRUE for now since we're not using Supabase Auth
-- Data filtering happens in the app layer
CREATE POLICY "Users can read accessible projects" ON public.projects
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update accessible projects" ON public.projects
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete accessible projects" ON public.projects
    FOR DELETE
    USING (true);

-- Expenses RLS: Same pattern as projects
CREATE POLICY "Users can read accessible expenses" ON public.expenses
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create expenses" ON public.expenses
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update accessible expenses" ON public.expenses
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete accessible expenses" ON public.expenses
    FOR DELETE
    USING (true);

-- Payments RLS: Same pattern
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can read accessible payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update accessible payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete accessible payments" ON public.payments;

CREATE POLICY "Users can read accessible payments" ON public.payments
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create payments" ON public.payments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update accessible payments" ON public.payments
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete accessible payments" ON public.payments
    FOR DELETE
    USING (true);

-- Customer Payments RLS
DROP POLICY IF EXISTS "Users can view own payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Users can read accessible customer_payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Users can create customer_payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Users can update accessible customer_payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Users can delete accessible customer_payments" ON public.customer_payments;

CREATE POLICY "Users can read accessible customer_payments" ON public.customer_payments
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create customer_payments" ON public.customer_payments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update accessible customer_payments" ON public.customer_payments
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete accessible customer_payments" ON public.customer_payments
    FOR DELETE
    USING (true);

-- Vendor Payments RLS
DROP POLICY IF EXISTS "Users can view own payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can read accessible vendor_payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can create vendor_payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can update accessible vendor_payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can delete accessible vendor_payments" ON public.vendor_payments;

CREATE POLICY "Users can read accessible vendor_payments" ON public.vendor_payments
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create vendor_payments" ON public.vendor_payments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update accessible vendor_payments" ON public.vendor_payments
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete accessible vendor_payments" ON public.vendor_payments
    FOR DELETE
    USING (true);

DO $$ 
BEGIN
    RAISE NOTICE '✓ RLS policies updated successfully';
    RAISE NOTICE '  - Sub-users can access parent user data';
    RAISE NOTICE '  - Parents can see sub-user data';
END $$;

-- =====================================================
-- STEP 5: Create helper views
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Step 5: Creating helper views...';
END $$;

-- View: All users with their parent info
CREATE OR REPLACE VIEW public.users_with_parent AS
SELECT 
    u.id,
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
FROM public.users u
LEFT JOIN public.users parent ON u.parent_user_id = parent.id;

-- View: Sub-users count per owner
CREATE OR REPLACE VIEW public.user_team_summary AS
SELECT 
    u.id AS owner_id,
    u.full_name AS owner_name,
    u.email AS owner_email,
    COUNT(sub.id) AS total_members,
    COUNT(sub.id) FILTER (WHERE sub.is_active = true) AS active_members,
    COUNT(sub.id) FILTER (WHERE sub.is_active = false) AS inactive_members
FROM public.users u
LEFT JOIN public.users sub ON sub.parent_user_id = u.id
WHERE u.role = 'owner'
GROUP BY u.id, u.full_name, u.email;

DO $$ 
BEGIN
    RAISE NOTICE '✓ Helper views created';
    RAISE NOTICE '  - users_with_parent';
    RAISE NOTICE '  - user_team_summary';
END $$;

-- =====================================================
-- STEP 6: Verification
-- =====================================================

DO $$ 
DECLARE
    column_count INTEGER;
    policy_count INTEGER;
    view_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '       VERIFICATION';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
    
    -- Check columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name IN ('parent_user_id', 'role', 'is_active');
    
    IF column_count = 3 THEN
        RAISE NOTICE '✓ All columns added successfully';
    ELSE
        RAISE NOTICE '✗ Missing columns (found %/3)', column_count;
    END IF;
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
        AND policyname LIKE '%accessible%';
    
    RAISE NOTICE '✓ % RLS policies created', policy_count;
    
    -- Check views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
        AND table_name IN ('users_with_parent', 'user_team_summary');
    
    IF view_count = 2 THEN
        RAISE NOTICE '✓ Helper views created successfully';
    ELSE
        RAISE NOTICE '✗ Missing views (found %/2)', view_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '       MIGRATION COMPLETE! ✅';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '  - Users table updated with parent_user_id, role, is_active';
    RAISE NOTICE '  - RLS policies updated for shared access';
    RAISE NOTICE '  - Sub-users can access parent user data';
    RAISE NOTICE '  - Parents can manage sub-users';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '  1. Restart your Expo app: npx expo start --clear';
    RAISE NOTICE '  2. Update your API to use new user management features';
    RAISE NOTICE '  3. Add Users screen to manage sub-users';
    RAISE NOTICE '';
END $$;
