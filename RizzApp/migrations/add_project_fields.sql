-- Migration: Add client_name, total_project_cost, and scope_of_work to projects table
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns to projects table
-- Note: Using TEXT[] array to support multiple scope selections
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS total_project_cost NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS scope_of_work TEXT[];

-- Step 2: Add comments for documentation
COMMENT ON COLUMN public.projects.client_name IS 'Name of the client for this project';
COMMENT ON COLUMN public.projects.total_project_cost IS 'Total estimated or actual project cost in currency';
COMMENT ON COLUMN public.projects.scope_of_work IS 'Array of work types being performed in this project (supports multiple selections)';

-- Step 3: Create index for better query performance on scope_of_work array
CREATE INDEX IF NOT EXISTS idx_projects_scope_of_work ON public.projects USING GIN (scope_of_work);

-- Step 4: Add constraint to ensure valid scope values (optional but recommended)
-- This ensures only valid work types can be inserted
-- Note: Drop constraint first if it exists, then create it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_valid_scope_of_work' 
    AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects DROP CONSTRAINT check_valid_scope_of_work;
  END IF;
END $$;

ALTER TABLE public.projects 
ADD CONSTRAINT check_valid_scope_of_work 
CHECK (
  scope_of_work IS NULL OR
  scope_of_work <@ ARRAY[
    'Carpentry Work',
    'Painting Work',
    'Aluminium Work',
    'Electrical Work',
    'Plumbing Work',
    'Flooring Work',
    'False Ceiling Work',
    'Masonry Work',
    'Tiling Work',
    'Glazing Work',
    'Door & Window Work',
    'Kitchen & Modular Work',
    'Interior Decoration',
    'Exterior Decoration',
    'Landscaping Work',
    'HVAC Work',
    'Waterproofing Work',
    'Structural Work',
    'Civil Work',
    'Plastering Work',
    'Wallpaper Work',
    'Furniture Work',
    'Lighting Work',
    'Partition Work',
    'Plaster of Paris Work',
    'Wood Flooring',
    'Marble & Granite Work',
    'Steel Fabrication',
    'Railing Work',
    'Staircase Work',
    'Bathroom Fitting',
    'Wardrobe Work',
    'Curtain & Blinds',
    'Wall Cladding',
    'Roofing Work',
    'Insulation Work',
    'Demolition Work',
    'Site Preparation',
    'Complete Interior Fit-out',
    'Complete Renovation',
    'Turnkey Project'
  ]::TEXT[]
);

-- Step 5: Update existing projects with default values (optional)
-- Uncomment if you want to set defaults for existing records
-- UPDATE public.projects 
-- SET client_name = 'Unknown Client',
--     total_project_cost = 0,
--     scope_of_work = ARRAY['Complete Renovation']
-- WHERE client_name IS NULL;
