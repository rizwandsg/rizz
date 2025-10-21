-- =====================================================
-- Add Traveling Expenses to Scope of Work Constraint
-- =====================================================

-- Drop the existing constraint
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS check_valid_scope_of_work;

-- Recreate the constraint with Traveling Expenses included
ALTER TABLE public.projects
ADD CONSTRAINT check_valid_scope_of_work 
CHECK (
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
    'Traveling Expenses',
    'Complete Interior Fit-out',
    'Complete Renovation',
    'Turnkey Project'
  ]::text[]
);

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'check_valid_scope_of_work';
