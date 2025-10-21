# Schema Fix Instructions

## Problem Analysis

Your app is not saving/displaying `scope_of_work` and expense `scope_of_work` because:

1. **Database migrations haven't been run** - The columns don't exist in Supabase yet
2. **AddExpense doesn't have scope_of_work field** - The UI needs to be updated

## Solution

### Step 1: Run Database Migrations in Supabase

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project
   - Click on "SQL Editor" in the left sidebar

2. **Run Verification Script** (RECOMMENDED FIRST)
   - Open the file: `migrations/verify_and_fix_schema.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click "Run"
   - Check the output messages - it will tell you what's missing

3. **If columns don't exist, the script will create them automatically**

### Step 2: Verify Database Changes

After running the migration, verify in Supabase:

1. Go to **Table Editor** > **projects** table
2. You should see these columns:
   - `client_name` (varchar)
   - `total_project_cost` (numeric)
   - `scope_of_work` (text array)

3. Go to **Table Editor** > **expenses** table
4. You should see:
   - `scope_of_work` (text)

### Step 3: Test the App

1. **Create a new project**:
   - Fill in project name
   - Add client name
   - Add total project cost
   - **Select multiple scopes** (e.g., Carpentry Work, Painting Work)
   - Save

2. **Check the console logs** (in terminal where you ran `npm start`):
   ```
   Saving project with data: {...}
   Scope of work being saved: ["Carpentry Work", "Painting Work"]
   ```

3. **Open Project Details**:
   - Check console logs:
   ```
   Loaded project data: {...}
   Project scope_of_work: ["Carpentry Work", "Painting Work"]
   ```
   - You should see the scopes displayed as badges

### Step 4: Common Issues & Fixes

#### Issue 1: "column does not exist" error
**Solution**: Run the migration script in Supabase

#### Issue 2: Scope saves but doesn't display
**Symptom**: Console shows `scope_of_work: null` when loading
**Solution**: 
- Check that you selected scopes before saving
- Check console log when saving to verify array is not empty
- Verify data in Supabase Table Editor

#### Issue 3: Permission denied
**Solution**: Check RLS (Row Level Security) policies in Supabase:
```sql
-- Allow users to insert their own projects
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own projects  
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to select their own projects
CREATE POLICY "Users can select own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);
```

### Step 5: Update AddExpense (Future Enhancement)

The expense form needs to be updated to include scope selection:

**Current status**: Expenses can be created but don't link to scopes yet
**TODO**: Add scope dropdown to AddExpense form (see todo list)

## Code Changes Made

### 1. AddProject.tsx
- ✅ Added logging to see what's being saved
- ✅ Already saves `scope_of_work` array correctly

### 2. ProjectDetails.tsx  
- ✅ Added logging to see what's being loaded
- ✅ Already displays `scope_of_work` badges correctly

### 3. Migrations Created
- ✅ `add_project_fields.sql` - Adds columns to projects table
- ✅ `add_scope_to_expenses.sql` - Adds scope to expenses table
- ✅ `verify_and_fix_schema.sql` - **NEW** - Verification and auto-fix script

## Quick Check Commands

Run these in Supabase SQL Editor to check data:

```sql
-- Check projects with new columns
SELECT 
    name, 
    client_name, 
    total_project_cost, 
    scope_of_work,
    created_at
FROM projects
ORDER BY created_at DESC
LIMIT 5;

-- Check expenses with scope
SELECT 
    description,
    amount,
    category,
    scope_of_work,
    expense_date
FROM expenses
ORDER BY created_at DESC
LIMIT 5;
```

## Next Steps After Fix

Once the database is fixed:

1. ✅ Projects with scopes will save and display correctly
2. ✅ Client name and total cost will save
3. ⏳ Update AddExpense form to add scope selection dropdown
4. ⏳ Filter expense categories based on selected scope
5. ⏳ Group expenses by scope in ProjectDetails

## Need Help?

If you still have issues:
1. Check the console logs for errors
2. Check Supabase logs (Logs & Analytics section)
3. Verify RLS policies are set correctly
4. Make sure you're logged in with a valid user
