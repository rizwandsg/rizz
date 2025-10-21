-- Verification and Fix Script for Projects and Expenses Schema
-- Run this in your Supabase SQL Editor to check and fix any issues

-- =====================================================
-- STEP 1: Check if columns exist
-- =====================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'projects'
    AND column_name IN ('client_name', 'total_project_cost', 'scope_of_work')
ORDER BY column_name;

-- Expected result:
-- client_name        | character varying | YES
-- total_project_cost | numeric           | YES
-- scope_of_work      | ARRAY             | YES

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'expenses'
    AND column_name = 'scope_of_work'
ORDER BY column_name;

-- Expected result:
-- scope_of_work | text | YES

-- =====================================================
-- STEP 2: If columns don't exist, add them
-- =====================================================

-- Add columns to projects table if they don't exist
DO $$ 
BEGIN
    -- Add client_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'client_name'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN client_name VARCHAR(255);
        RAISE NOTICE 'Added client_name column to projects';
    ELSE
        RAISE NOTICE 'client_name column already exists in projects';
    END IF;

    -- Add total_project_cost
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'total_project_cost'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN total_project_cost NUMERIC(15, 2);
        RAISE NOTICE 'Added total_project_cost column to projects';
    ELSE
        RAISE NOTICE 'total_project_cost column already exists in projects';
    END IF;

    -- Add scope_of_work
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'scope_of_work'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN scope_of_work TEXT[];
        RAISE NOTICE 'Added scope_of_work column to projects';
    ELSE
        RAISE NOTICE 'scope_of_work column already exists in projects';
    END IF;
END $$;

-- Add scope_of_work to expenses table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'scope_of_work'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN scope_of_work TEXT;
        RAISE NOTICE 'Added scope_of_work column to expenses';
    ELSE
        RAISE NOTICE 'scope_of_work column already exists in expenses';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Create indexes if they don't exist
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_projects_scope_of_work ON public.projects USING GIN (scope_of_work);
CREATE INDEX IF NOT EXISTS idx_expenses_scope_of_work ON public.expenses (scope_of_work);

DO $$ 
BEGIN
    RAISE NOTICE 'Indexes created or verified';
END $$;

-- =====================================================
-- STEP 4: Test insert and retrieve
-- =====================================================

-- Test: Create a test project with scope_of_work
DO $$
DECLARE
    test_user_id uuid;
    test_project_id uuid;
    test_project_record RECORD;
BEGIN
    -- Get a user ID (use the first user in the table)
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please create a user first.';
        RETURN;
    END IF;

    -- Insert a test project
    INSERT INTO public.projects (
        user_id, 
        name, 
        description, 
        start_date, 
        status,
        client_name,
        total_project_cost,
        scope_of_work
    ) VALUES (
        test_user_id,
        'TEST PROJECT - DELETE ME',
        'This is a test project to verify scope_of_work array functionality',
        CURRENT_DATE,
        'active',
        'Test Client',
        50000.00,
        ARRAY['Carpentry Work', 'Painting Work', 'Electrical Work']::TEXT[]
    )
    RETURNING id INTO test_project_id;

    -- Retrieve and display the test project
    SELECT * INTO test_project_record 
    FROM public.projects 
    WHERE id = test_project_id;

    RAISE NOTICE 'Test project created successfully!';
    RAISE NOTICE 'Project ID: %', test_project_id;
    RAISE NOTICE 'Client Name: %', test_project_record.client_name;
    RAISE NOTICE 'Total Cost: %', test_project_record.total_project_cost;
    RAISE NOTICE 'Scope of Work: %', test_project_record.scope_of_work;

    -- Clean up test project
    DELETE FROM public.projects WHERE id = test_project_id;
    RAISE NOTICE 'Test project deleted. Schema verification complete!';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during test: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 5: View current data to debug
-- =====================================================

-- Show all projects with new columns
SELECT 
    id,
    name,
    client_name,
    total_project_cost,
    scope_of_work,
    created_at
FROM public.projects
ORDER BY created_at DESC
LIMIT 5;

-- Show all expenses with scope_of_work
SELECT 
    id,
    description,
    amount,
    category,
    scope_of_work,
    expense_date
FROM public.expenses
ORDER BY expense_date DESC
LIMIT 5;

-- =====================================================
-- FINAL NOTES
-- =====================================================
-- After running this script:
-- 1. Check the output messages for any errors
-- 2. Verify that test project was created and deleted successfully
-- 3. Check that your existing projects and expenses are displaying correctly
-- 4. If the test passed, try creating a new project from your app
