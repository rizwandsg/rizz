# 🔗 Clerk + Supabase User Integration Guide

## 📊 Current Analysis

### Your Current Regular Signup Flow:
```typescript
// app/(auth)/signup.tsx → calls authApi.signup()
1. User enters: email, password, full_name
2. Password gets hashed (SHA256)
3. User saved to Supabase 'users' table with:
   - email
   - password_hash
   - full_name
   - role: 'owner'
   - is_active: true
   - parent_user_id: null
4. User data stored in AsyncStorage
```

### Your Supabase Users Table Schema:
```sql
users {
  id (uuid, primary key)
  email (text, unique)
  password_hash (text) -- SHA256 for regular signup
  full_name (text)
  phone (text, optional)
  role ('owner' | 'member')
  is_active (boolean)
  parent_user_id (uuid, nullable, foreign key)
  created_at (timestamp)
  updated_at (timestamp)
  last_login (timestamp)
}
```

---

## 🎯 Goal: Sync Clerk Users to Supabase

When a user signs up via **Clerk**, we need to:
1. ✅ Create user in Clerk (handles authentication)
2. ✅ Also create user in Supabase `users` table (for app data)
3. ✅ Link Clerk user ID with Supabase record

---

## 🔧 Solution: Add Clerk User to Supabase After Signup

### Option 1: **Sync After Verification** (Recommended)

Update `app/(auth)/clerk-signup.tsx` to save user after email verification:

```typescript
import { database } from '../../services/databaseService';

const handleVerify = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
        // Step 1: Verify email with code
        const completeSignUp = await signUp.attemptEmailAddressVerification({ code });

        // Step 2: Set the session as active
        await setActive({ session: completeSignUp.createdSessionId });

        // ✨ NEW: Step 3: Save Clerk user to Supabase
        const clerkUser = completeSignUp.createdUserId;
        const clerkEmail = signUp.emailAddress;

        await database.saveData('users', {
            clerk_user_id: clerkUser,        // Link to Clerk
            email: clerkEmail,
            password_hash: null,             // No password for Clerk users
            full_name: clerkEmail.split('@')[0], // Extract from email
            role: 'owner',                   // New Clerk signups are owners
            is_active: true,
            parent_user_id: null,
        });

        console.log('✅ Clerk user synced to Supabase');

        // Step 4: Navigate to home
        Alert.alert('Success!', 'Your account has been created', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
        ]);
    } catch (err: any) {
        console.error('❌ Verification Error:', err);
        Alert.alert('Verification Failed', err.message);
    } finally {
        setLoading(false);
    }
};
```

---

## 📝 Schema Update Required

Add `clerk_user_id` column to your Supabase `users` table:

### SQL Migration:
```sql
-- Add clerk_user_id column to users table
ALTER TABLE users 
ADD COLUMN clerk_user_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);

-- Make password_hash nullable (Clerk users don't have passwords)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;
```

### Updated Schema:
```sql
users {
  id (uuid, primary key)
  clerk_user_id (text, unique, nullable)  -- 🆕 NEW FIELD
  email (text, unique)
  password_hash (text, nullable)          -- 🔄 NOW NULLABLE
  full_name (text)
  phone (text, optional)
  role ('owner' | 'member')
  is_active (boolean)
  parent_user_id (uuid, nullable)
  created_at (timestamp)
  updated_at (timestamp)
  last_login (timestamp)
}
```

---

## 🔄 Update TypeScript User Interface

Update `api/authApi.ts`:

```typescript
export interface User {
    id: string;
    clerk_user_id?: string;     // 🆕 NEW: Clerk user ID
    email: string;
    full_name: string;
    phone?: string;
    created_at: string;
    updated_at?: string;
    last_login?: string;
    parent_user_id?: string | null;
    role?: 'owner' | 'member';
    is_active?: boolean;
}
```

---

## 🎨 Enhanced Implementation with Full Name

### Ask for full name during Clerk signup:

```typescript
// app/(auth)/clerk-signup.tsx
export default function ClerkSignUpScreen() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');  // 🆕 ADD THIS
    const [password, setPassword] = useState('');
    // ... rest of state

    const handleSignUp = async () => {
        if (!isLoaded) return;

        // Validation
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!fullName.trim()) {  // 🆕 VALIDATE NAME
            Alert.alert('Error', 'Please enter your full name');
            return;
        }
        if (!password || password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName: fullName.split(' ')[0],    // 🆕 First word as first name
                lastName: fullName.split(' ').slice(1).join(' '), // 🆕 Rest as last name
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err: any) {
            Alert.alert('Sign Up Failed', err.errors?.[0]?.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        // ... verification logic

        // Save to Supabase with full name
        await database.saveData('users', {
            clerk_user_id: completeSignUp.createdUserId,
            email: email,
            password_hash: null,
            full_name: fullName,  // 🆕 Use actual full name
            role: 'owner',
            is_active: true,
            parent_user_id: null,
        });
    };

    return (
        <View>
            {/* Add Full Name Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="account" size={20} color="#999" />
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#999"
                        autoCapitalize="words"
                    />
                </View>
            </View>

            {/* Email input... */}
            {/* Password input... */}
        </View>
    );
}
```

---

## 🔐 Update Clerk Sign-In

Sync `last_login` when user signs in via Clerk:

```typescript
// app/(auth)/clerk-signin.tsx
import { database } from '../../services/databaseService';
import { useUser } from '@clerk/clerk-expo';

const handleSignIn = async () => {
    // ... existing sign-in logic

    await setActive({ session: completeSignIn.createdSessionId });

    // ✨ NEW: Update last_login in Supabase
    try {
        const clerkUserId = completeSignIn.createdUserId;
        
        // Find user in Supabase by clerk_user_id
        const users = await database.loadData<any>('users', {
            filter: `clerk_user_id.eq.${clerkUserId}`
        });

        if (users && users.length > 0) {
            const user = users[0];
            await database.updateData('users', user.id, {
                last_login: new Date().toISOString(),
            });
            console.log('✅ Updated last_login for Clerk user');
        }
    } catch (error) {
        console.error('⚠️ Failed to update last_login:', error);
        // Don't block login if this fails
    }

    router.replace('/(tabs)/home');
};
```

---

## 🎯 Helper Function: Get Current User

Create a helper to fetch user data from Supabase using Clerk ID:

```typescript
// api/authApi.ts

import { useAuth } from '@clerk/clerk-expo';

/**
 * Get Supabase user data for current Clerk user
 */
export const getSupabaseUserFromClerk = async (clerkUserId: string): Promise<User | null> => {
    try {
        const users = await database.loadData<User>('users', {
            filter: `clerk_user_id.eq.${clerkUserId}`
        });

        if (users && users.length > 0) {
            return users[0];
        }

        return null;
    } catch (error) {
        console.error('Failed to get Supabase user:', error);
        return null;
    }
};

/**
 * React Hook: Get current user from Supabase
 */
export const useSupabaseUser = () => {
    const { userId } = useAuth(); // Clerk user ID
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            getSupabaseUserFromClerk(userId).then(data => {
                setUser(data);
                setLoading(false);
            });
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [userId]);

    return { user, loading };
};
```

---

## 📋 Migration Checklist

- [ ] **1. Update Supabase Schema**
  - Add `clerk_user_id` column (TEXT, UNIQUE)
  - Make `password_hash` nullable
  - Add index on `clerk_user_id`

- [ ] **2. Update TypeScript Interface**
  - Add `clerk_user_id?: string` to User interface

- [ ] **3. Update clerk-signup.tsx**
  - Add full name input field
  - Save user to Supabase after verification
  - Include `clerk_user_id` in save

- [ ] **4. Update clerk-signin.tsx**
  - Update `last_login` on sign in

- [ ] **5. Create Helper Functions**
  - `getSupabaseUserFromClerk()`
  - `useSupabaseUser()` hook

- [ ] **6. Test Both Flows**
  - Regular signup (existing flow)
  - Clerk signup (new flow)
  - Verify both create Supabase records

---

## 🎯 Summary

**Two Authentication Methods:**

| Method | Email | Password | Clerk | Supabase |
|--------|-------|----------|-------|----------|
| **Regular** | ✅ | ✅ SHA256 | ❌ | ✅ password_hash |
| **Clerk** | ✅ | ✅ Clerk | ✅ clerk_user_id | ✅ clerk_user_id |

**Key Points:**
- Regular users: `password_hash` populated, no `clerk_user_id`
- Clerk users: `clerk_user_id` populated, `password_hash` is null
- Both methods create records in Supabase `users` table
- Clerk handles authentication, Supabase stores app data

**Ready to implement!** 🚀
