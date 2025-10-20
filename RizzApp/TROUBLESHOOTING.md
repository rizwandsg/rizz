# 🔧 Troubleshooting Guide

## Error: "Failed to create user"

This error can occur during signup for several reasons. Follow these steps to fix it:

### 1. Check Console Logs

The app now has detailed logging. Check your console for:
- "Supabase URL: Configured" or "Missing"
- "Supabase Key: Configured" or "Missing"
- "Saving data to users:" with the user data
- Any Supabase-specific error messages

### 2. Verify Supabase Configuration

#### Check `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://brakxnutybnobmbdssqt.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Check `app.config.js`:
```javascript
extra: {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
  ...
}
```

### 3. Restart the Development Server

After changing `.env` or `app.config.js`:

```bash
# Stop the server (Ctrl+C)
# Clear cache and restart
npx expo start --clear
```

### 4. Check Supabase Database

Go to your Supabase dashboard and verify:

#### Table exists:
- Table name: `users`
- Columns: `id`, `email`, `password_hash`, `full_name`, `created_at`, `updated_at`, `last_login`

#### RLS is configured:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- If RLS is too strict, temporarily disable for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows inserts
CREATE POLICY "Allow public inserts"
ON users FOR INSERT
WITH CHECK (true);
```

### 5. Test Supabase Connection

Create a test file to verify connection:

```typescript
// testSupabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://brakxnutybnobmbdssqt.supabase.co';
const supabaseKey = 'your-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase
    .from('users')
    .select('count');
  
  if (error) {
    console.error('Connection error:', error);
  } else {
    console.log('Connection successful!', data);
  }
}

testConnection();
```

### 6. Check Network Connection

- Ensure device/emulator has internet connection
- Try accessing Supabase dashboard in browser
- Check if firewall is blocking the connection

### 7. Common Supabase Errors

#### "JWT expired" or "Invalid API key"
- Check if your Supabase key is correct
- Get a fresh key from Supabase dashboard > Settings > API

#### "relation 'users' does not exist"
- Table not created yet
- Run the schema.sql in Supabase SQL Editor

#### "new row violates row-level security policy"
- RLS policies are too strict
- Temporarily disable RLS for testing
- Or create appropriate INSERT policy

#### "duplicate key value violates unique constraint"
- Email already exists in database
- Use a different email for testing

### 8. Alternative: Disable RLS for Development

For development/testing only:

```sql
-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test signup again

-- Re-enable when ready
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 9. Check expo-crypto

If the error is specifically from `expo-crypto`:

```bash
# Reinstall expo-crypto
npm uninstall expo-crypto
npm install expo-crypto

# Clear cache
npx expo start --clear
```

### 10. Use Simple Password for Testing

Try with a simple password first:
- Password: `test123`
- Email: `test@example.com`
- Full Name: `Test User`

### Debug Mode

Enable detailed logging in `api/authApi.ts`:

```typescript
export const signup = async (data: SignupData): Promise<User> => {
  try {
    console.log('1. Starting signup');
    console.log('2. Data:', data);
    
    const passwordHash = await hashPassword(data.password);
    console.log('3. Password hashed');
    
    const existingUser = await database.loadData<User>('users', {
      filter: `email.eq.${data.email}`
    });
    console.log('4. Checked existing user:', existingUser);
    
    const newUser = {
      email: data.email,
      password_hash: passwordHash,
      full_name: data.full_name,
    };
    console.log('5. Creating user:', newUser);
    
    const createdUser = await database.saveData('users', newUser);
    console.log('6. User created:', createdUser);
    
    // ... rest of code
  } catch (error) {
    console.error('ERROR AT:', error);
    throw error;
  }
};
```

### Quick Fix Checklist

- [ ] Restart expo server with `--clear` flag
- [ ] Verify `.env` file has correct Supabase credentials
- [ ] Check Supabase dashboard - is `users` table created?
- [ ] Temporarily disable RLS on users table
- [ ] Check console logs for specific error message
- [ ] Try with simple test credentials
- [ ] Verify internet connection
- [ ] Check if Supabase project is active (not paused)

### Get More Help

If still not working, share:
1. Full console error message
2. Supabase table structure
3. RLS policies status
4. Contents of app.config.js (extra section)

---

**Most Common Issue**: RLS (Row Level Security) is blocking the INSERT operation.

**Quick Test**: Temporarily disable RLS on the users table and try again.