-- Migration: Add scope_of_work column to expenses table
-- This links expenses to specific scopes within a project
-- Run this in your Supabase SQL Editor

-- Step 1: Add scope_of_work column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS scope_of_work TEXT;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.expenses.scope_of_work IS 'The specific scope of work this expense belongs to (e.g., Carpentry Work, Painting Work). Links expense to project scope.';

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_scope_of_work ON public.expenses (scope_of_work);

-- Step 4: Add constraint to ensure scope exists in project's scopes (optional - for data integrity)
-- Note: This is a soft constraint - we validate in the application layer
-- Uncomment if you want database-level validation

-- ALTER TABLE public.expenses 
-- ADD CONSTRAINT check_scope_in_project
-- CHECK (
--   scope_of_work IS NULL OR
--   EXISTS (
--     SELECT 1 FROM public.projects 
--     WHERE projects.id = expenses.project_id 
--     AND scope_of_work = ANY(projects.scope_of_work)
--   )
-- );

-- Step 5: Modify category column to be more flexible (if needed)
-- The category field will now be context-aware based on scope_of_work
-- No changes needed to schema, just usage pattern

-- Step 6: Create helper view for expense analysis by scope
CREATE OR REPLACE VIEW expense_by_scope AS
SELECT 
    e.project_id,
    e.scope_of_work,
    e.category,
    COUNT(*) as expense_count,
    SUM(e.amount) as total_amount,
    AVG(e.amount) as avg_amount,
    MIN(e.expense_date) as first_expense,
    MAX(e.expense_date) as last_expense
FROM public.expenses e
WHERE e.scope_of_work IS NOT NULL
GROUP BY e.project_id, e.scope_of_work, e.category;

COMMENT ON VIEW expense_by_scope IS 'Aggregated view of expenses grouped by project, scope, and category';

-- Step 7: Create view for project scope budget tracking
CREATE OR REPLACE VIEW project_scope_budget AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.total_project_cost,
    scope_item as scope,
    COALESCE(
        (SELECT SUM(e.amount) 
         FROM public.expenses e 
         WHERE e.project_id = p.id 
         AND e.scope_of_work = scope_item
        ), 0
    ) as scope_expenses,
    p.total_project_cost - COALESCE(
        (SELECT SUM(e.amount) 
         FROM public.expenses e 
         WHERE e.project_id = p.id
        ), 0
    ) as remaining_budget
FROM public.projects p
CROSS JOIN LATERAL unnest(p.scope_of_work) as scope_item
WHERE p.scope_of_work IS NOT NULL AND array_length(p.scope_of_work, 1) > 0;

COMMENT ON VIEW project_scope_budget IS 'Budget tracking per scope for each project';
