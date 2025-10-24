-- ============================================
-- Clerk + Supabase Integration Migration
-- ============================================
-- This migration adds support for Clerk authentication
-- while maintaining existing password-based auth

-- Step 1: Add clerk_user_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Step 2: Add index for faster Clerk user lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id 
ON users(clerk_user_id);

-- Step 3: Make password_hash nullable (Clerk users don't have passwords)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Step 4: Add comment explaining the fields
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk user ID for users authenticated via Clerk. NULL for regular password-based users.';
COMMENT ON COLUMN users.password_hash IS 'SHA256 password hash for regular users. NULL for Clerk-authenticated users.';

-- ============================================
-- Verification Queries
-- ============================================

-- Check if columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('clerk_user_id', 'password_hash')
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users'
AND indexname LIKE '%clerk%';

-- ============================================
-- Sample Queries
-- ============================================

-- Find all Clerk users
SELECT id, email, full_name, clerk_user_id, created_at
FROM users
WHERE clerk_user_id IS NOT NULL;

-- Find all regular password users
SELECT id, email, full_name, created_at
FROM users
WHERE clerk_user_id IS NULL AND password_hash IS NOT NULL;

-- Count users by auth method
SELECT 
    CASE 
        WHEN clerk_user_id IS NOT NULL THEN 'Clerk'
        WHEN password_hash IS NOT NULL THEN 'Password'
        ELSE 'Unknown'
    END as auth_method,
    COUNT(*) as user_count
FROM users
GROUP BY auth_method;
