-- Add phone column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add comment to the column
COMMENT ON COLUMN public.users.phone IS 'User phone number';
