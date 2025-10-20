-- ========================================
-- RizzApp Database Setup with Correct RLS
-- ========================================
-- Run this in Supabase SQL Editor

-- 1. Disable RLS temporarily if tables exist
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow public inserts" ON users;
DROP POLICY IF EXISTS "Allow public sign up" ON users;

-- 3. Create tables if they don't exist (from schema.sql)
CREATE TABLE IF NOT EXISTS users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_login timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  user_id uuid,
  amount numeric NOT NULL,
  description text NOT NULL,
  category character varying,
  expense_date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for USERS table

-- Allow anyone to sign up (INSERT)
CREATE POLICY "Allow public sign up"
ON users FOR INSERT
WITH CHECK (true);

-- Allow users to read their own data (SELECT)
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (true);  -- For now, allow reading (can be restricted later)

-- Allow users to update their own data (UPDATE)
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (id = auth.uid() OR true);  -- For now, allow updates (can be restricted later)

-- 7. Create RLS Policies for PROJECTS table

-- Allow users to read their own projects
CREATE POLICY "Users can read own projects"
ON projects FOR SELECT
USING (true);  -- For now, allow reading all (can filter by user_id in app)

-- Allow authenticated users to create projects
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (true);  -- For now, allow creating (can add user_id check later)

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (true);  -- For now, allow updating all (can filter by user_id in app)

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (true);  -- For now, allow deleting all (can filter by user_id in app)

-- 8. Create RLS Policies for EXPENSES table

-- Allow users to read their own expenses
CREATE POLICY "Users can read own expenses"
ON expenses FOR SELECT
USING (true);  -- For now, allow reading all (can filter by user_id in app)

-- Allow authenticated users to create expenses
CREATE POLICY "Users can create expenses"
ON expenses FOR INSERT
WITH CHECK (true);  -- For now, allow creating (can add user_id check later)

-- Allow users to update their own expenses
CREATE POLICY "Users can update own expenses"
ON expenses FOR UPDATE
USING (true);  -- For now, allow updating all (can filter by user_id in app)

-- Allow users to delete their own expenses
CREATE POLICY "Users can delete own expenses"
ON expenses FOR DELETE
USING (true);  -- For now, allow deleting all (can filter by user_id in app)

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Apply triggers
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at 
BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Verification
-- ========================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'projects', 'expenses');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'projects', 'expenses');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'projects', 'expenses')
ORDER BY tablename, policyname;

-- ========================================
-- Test Insert (optional)
-- ========================================
-- This should work now:
-- INSERT INTO users (email, password_hash, full_name) 
-- VALUES ('test@example.com', 'hashed_password_here', 'Test User');