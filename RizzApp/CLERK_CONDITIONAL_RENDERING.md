# 🎯 Clerk Conditional Rendering Guide

## 🔑 What are `<SignedIn>` and `<SignedOut>`?

These are Clerk's components that show/hide content based on authentication status:

- **`<SignedIn>`** - Only renders children when user is **logged in**
- **`<SignedOut>`** - Only renders children when user is **NOT logged in**

---

## ✅ **How to Use**

### Basic Example:

```tsx
import { SignedIn, SignedOut } from '@clerk/clerk-expo';

export default function MyScreen() {
  return (
    <View>
      <SignedIn>
        <Text>You are logged in!</Text>
      </SignedIn>

      <SignedOut>
        <Text>Please log in</Text>
      </SignedOut>
    </View>
  );
}
```

---

## 📱 **Real-World Examples**

### Example 1: Show Different Navigation

```tsx
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Link } from 'expo-router';

export default function Header() {
  return (
    <View style={styles.header}>
      <SignedIn>
        {/* Show when logged in */}
        <Link href="/(tabs)/profile">
          <Text>My Profile</Text>
        </Link>
        <SignOutButton />
      </SignedIn>

      <SignedOut>
        {/* Show when logged out */}
        <Link href="/(auth)/clerk-signin">
          <Text>Sign In</Text>
        </Link>
        <Link href="/(auth)/clerk-signup">
          <Text>Sign Up</Text>
        </Link>
      </SignedOut>
    </View>
  );
}
```

### Example 2: Protect Content

```tsx
import { SignedIn, SignedOut } from '@clerk/clerk-expo';

export default function Dashboard() {
  return (
    <View>
      <SignedIn>
        {/* Protected content */}
        <ProjectList />
        <ExpenseTracker />
        <Analytics />
      </SignedIn>

      <SignedOut>
        {/* Public content */}
        <Text>Sign in to view your dashboard</Text>
        <Link href="/(auth)/clerk-signin">
          <Button title="Sign In" />
        </Link>
      </SignedOut>
    </View>
  );
}
```

### Example 3: Conditional UI Elements

```tsx
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo';

export default function WelcomeScreen() {
  return (
    <View>
      <SignedIn>
        {/* Personalized greeting */}
        <UserGreeting />
        <Text>Welcome back!</Text>
      </SignedIn>

      <SignedOut>
        {/* Generic welcome */}
        <Text>Welcome to RizzApp</Text>
        <Text>Please sign in to continue</Text>
      </SignedOut>
    </View>
  );
}

function UserGreeting() {
  const { user } = useUser();
  return <Text>Hello, {user?.firstName}!</Text>;
}
```

---

## 🎨 **Use in Your Existing Screens**

### Update Profile Screen

In `app/(tabs)/profile.tsx`:

```tsx
import { SignedIn, SignedOut } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  return (
    <View>
      <SignedIn>
        {/* Your existing profile content */}
        <UserProfile />
        <Settings />
        <SignOutButton />
      </SignedIn>

      <SignedOut>
        {/* Redirect or show login */}
        <Text>Not signed in</Text>
        <Link href="/(auth)/clerk-signin">Sign In</Link>
      </SignedOut>
    </View>
  );
}
```

### Update Home Screen

In `app/(tabs)/home.tsx`:

```tsx
import { SignedIn, SignedOut } from '@clerk/clerk-expo';

export default function HomeScreen() {
  return (
    <View>
      <SignedIn>
        {/* Show projects for logged-in users */}
        <ProjectsList />
      </SignedIn>

      <SignedOut>
        {/* Show landing page */}
        <LandingPage />
      </SignedOut>
    </View>
  );
}
```

---

## 🚀 **Advanced Patterns**

### Pattern 1: Mixed Content

```tsx
export default function Screen() {
  return (
    <View>
      {/* Always visible */}
      <Header />
      
      <SignedIn>
        {/* Only for authenticated */}
        <PrivateContent />
      </SignedIn>

      <SignedOut>
        {/* Only for guests */}
        <PublicContent />
      </SignedOut>

      {/* Always visible */}
      <Footer />
    </View>
  );
}
```

### Pattern 2: With useAuth Hook

```tsx
import { SignedIn, useAuth } from '@clerk/clerk-expo';

export default function Screen() {
  const { userId } = useAuth();

  return (
    <SignedIn>
      <Text>User ID: {userId}</Text>
      <ProtectedContent />
    </SignedIn>
  );
}
```

### Pattern 3: Nested Conditions

```tsx
import { SignedIn, useUser } from '@clerk/clerk-expo';

export default function Screen() {
  const { user } = useUser();

  return (
    <SignedIn>
      {user?.publicMetadata?.role === 'admin' ? (
        <AdminPanel />
      ) : (
        <UserDashboard />
      )}
    </SignedIn>
  );
}
```

---

## 📋 **When to Use Each Approach**

| Use Case | Best Approach |
|----------|--------------|
| Show/hide UI elements | `<SignedIn>` / `<SignedOut>` |
| Check auth status in logic | `useAuth()` hook |
| Get user data | `useUser()` hook |
| Protect entire routes | Route layout `_layout.tsx` |
| Sign out functionality | `useClerk()` hook |

---

## ✅ **Example File Created**

I created: `app/ClerkConditionalExample.tsx`

To test it:
1. Add to your Stack in `_layout.tsx`:
```tsx
<Stack.Screen name="ClerkConditionalExample" />
```

2. Navigate to it:
```tsx
router.push('/ClerkConditionalExample');
```

---

## 🎯 **Summary**

**`<SignedIn>` and `<SignedOut>`** are perfect for:
- ✅ Showing different UI based on auth status
- ✅ Protecting content visually
- ✅ Conditional navigation
- ✅ Personalized experiences

**They automatically:**
- 🔄 Update when auth status changes
- ⚡ Render instantly (no flicker)
- 🎨 Work with any React Native components

---

## 📚 **Available Clerk Components**

```tsx
import { 
  SignedIn,        // Show when logged in
  SignedOut,       // Show when logged out
  useAuth,         // Get auth status
  useUser,         // Get user data
  useClerk,        // Get Clerk instance
  useSignIn,       // Sign in methods
  useSignUp,       // Sign up methods
} from '@clerk/clerk-expo';
```

---

## 🚀 **You're Ready!**

Use `<SignedIn>` and `<SignedOut>` anywhere in your app to conditionally show content based on authentication status!

Check the example file: `app/ClerkConditionalExample.tsx` 🎉
