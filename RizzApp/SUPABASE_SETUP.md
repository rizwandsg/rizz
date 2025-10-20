# Supabase Setup Guide

## ✅ Completed Steps

1. ✅ Installed Supabase client (`@supabase/supabase-js`)
2. ✅ Installed expo-crypto for password hashing
3. ✅ Created database schema (users, projects, expenses)
4. ✅ Updated .env with Supabase credentials
5. ✅ Created API modules:
   - `api/authApi.ts` - Authentication (signup, login, logout)
   - `api/projectsApi.ts` - Projects CRUD operations
   - `api/expensesApi.ts` - Expenses CRUD operations
6. ✅ Created `services/databaseService.ts` for Supabase operations
7. ✅ Updated `services/storageService.ts` to use Supabase

## 🔐 Security Setup (Required)

You need to set up Row Level Security (RLS) policies in Supabase to protect your data.

### 1. Enable RLS

Go to your Supabase dashboard > Authentication > Policies, and run these SQL commands:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies

```sql
-- Users table policies (users can only read their own data)
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can insert own data"
ON users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (id = current_setting('app.user_id')::uuid);

-- Projects table policies
CREATE POLICY "Users can read own projects"
ON projects FOR SELECT
USING (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (user_id = current_setting('app.user_id')::uuid);

-- Expenses table policies
CREATE POLICY "Users can read own expenses"
ON expenses FOR SELECT
USING (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY "Users can insert own expenses"
ON expenses FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY "Users can update own expenses"
ON expenses FOR UPDATE
USING (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY "Users can delete own expenses"
ON expenses FOR DELETE
USING (user_id = current_setting('app.user_id')::uuid);
```

### 3. Create Triggers for Updated_at

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to projects table
CREATE TRIGGER update_projects_updated_at 
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to expenses table
CREATE TRIGGER update_expenses_updated_at 
BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📝 Environment Variables

Make sure your `.env` file has these values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://brakxnutybnobmbdssqt.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Usage

### Authentication

```typescript
import { signup, login, logout } from './api/authApi';

// Signup
const user = await signup({
    email: 'user@example.com',
    password: 'password123',
    full_name: 'John Doe'
});

// Login
const user = await login({
    email: 'user@example.com',
    password: 'password123'
});

// Logout
await logout();
```

### Projects

```typescript
import { createProject, getProjects, updateProject } from './api/projectsApi';

// Create project
const project = await createProject({
    name: 'My Project',
    description: 'Project description',
    start_date: '2025-01-01',
    end_date: '2025-12-31'
});

// Get all projects
const projects = await getProjects();

// Update project
await updateProject(project.id!, { status: 'completed' });
```

### Expenses

```typescript
import { createExpense, getExpensesByProject } from './api/expensesApi';

// Create expense
const expense = await createExpense({
    project_id: projectId,
    amount: 150.50,
    description: 'Office supplies',
    category: 'supplies',
    expense_date: '2025-01-15'
});

// Get project expenses
const expenses = await getExpensesByProject(projectId);
```

## 📂 Project Structure

```
RizzApp/
├── api/
│   ├── authApi.ts          # Authentication functions
│   ├── projectsApi.ts      # Projects CRUD
│   ├── expensesApi.ts      # Expenses CRUD
│   ├── index.ts            # Export all APIs
│   └── README.md           # API documentation
├── services/
│   ├── databaseService.ts  # Supabase client wrapper
│   └── storageService.ts   # Local + cloud storage sync
├── .env                    # Environment variables
└── schema.sql              # Database schema
```

## 🔄 Data Flow

1. **Local Storage** - Data is cached locally using AsyncStorage
2. **Automatic Sync** - Data syncs to Supabase every 5 minutes or when saved
3. **Authentication** - Custom authentication using users table (not Supabase Auth)
4. **Security** - Row Level Security ensures users only see their own data

## 🧪 Testing

1. Create a test user:
```typescript
const user = await signup({
    email: 'test@example.com',
    password: 'test123',
    full_name: 'Test User'
});
```

2. Create a test project:
```typescript
const project = await createProject({
    name: 'Test Project',
    start_date: '2025-01-01'
});
```

3. Add test expense:
```typescript
const expense = await createExpense({
    project_id: project.id!,
    amount: 100,
    description: 'Test expense',
    expense_date: '2025-01-15'
});
```

## ⚠️ Important Notes

1. **Password Security**: Passwords are hashed using SHA-256 before storage
2. **User Authorization**: All API calls check if user is authenticated
3. **Data Isolation**: RLS policies ensure users can only access their own data
4. **Offline Support**: Local storage provides offline functionality
5. **Auto-sync**: Data automatically syncs when online

## 📚 Next Steps

1. Set up RLS policies in Supabase (see Security Setup section)
2. Test authentication flow
3. Test project and expense operations
4. Implement UI components using the API
5. Add error handling in your components
6. Consider adding data validation
7. Set up real-time subscriptions (optional)

## 🐛 Troubleshooting

### "User not authenticated" error
- Make sure user is logged in before making API calls
- Check if token is stored in AsyncStorage

### Database errors
- Verify RLS policies are set up correctly
- Check Supabase dashboard for error logs
- Ensure environment variables are correct

### Sync issues
- Check internet connection
- Verify Supabase URL and key are correct
- Check browser/app console for errors