# 🚪 SignOutButton Component Usage Guide

## ✅ Component Created

Location: `components/SignOutButton.tsx`

## 📝 How to Use

### Option 1: Simple Usage (Anywhere in Your App)

```tsx
import { SignOutButton } from '../../components/SignOutButton';

export default function MyScreen() {
  return (
    <View>
      <SignOutButton />
    </View>
  );
}
```

### Option 2: Add to Profile Screen

In `app/(tabs)/profile.tsx`, add this where you want the sign-out button:

```tsx
import { SignOutButton } from '../../components/SignOutButton';

// Inside your component:
<SignOutButton />
```

### Option 3: Use Clerk's useAuth Hook Directly

If you want more control, use this pattern:

```tsx
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function MyScreen() {
  const { signOut, isSignedIn } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (!isSignedIn) {
    return <Text>Not signed in</Text>;
  }

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign Out</Text>
    </TouchableOpacity>
  );
}
```

## 🎯 Features

✅ **Uses Clerk's useClerk() hook** - Official Clerk method  
✅ **Styled button** - Matches your app design  
✅ **Error handling** - Catches and logs errors  
✅ **Auto-redirect** - Goes to login after sign out  
✅ **Expo Router** - Uses router.replace() instead of Linking  

## 🔧 Customization

### Change Button Style

Edit `components/SignOutButton.tsx`:

```tsx
const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B6B',  // ← Change color
    borderRadius: 8,              // ← Change radius
    alignItems: 'center',
  },
  text: {
    color: '#fff',                // ← Change text color
    fontSize: 16,                 // ← Change font size
    fontWeight: '600',
  },
});
```

### Add Icon

```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';

return (
  <TouchableOpacity onPress={handleSignOut} style={styles.button}>
    <MaterialCommunityIcons name="logout" size={20} color="#fff" />
    <Text style={styles.text}>Sign Out</Text>
  </TouchableOpacity>
);
```

### Add Confirmation Dialog

```tsx
import { Alert } from 'react-native';

const handleSignOut = async () => {
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (err) {
            console.error('Sign out error:', err);
          }
        },
      },
    ]
  );
};
```

## 📱 Example: Replace Logout in Profile

Your profile already has a logout button. You can replace it with Clerk's:

**Before (Current):**
```tsx
import { logout } from '../../api/authApi';

const handleLogout = async () => {
  await logout();
  router.replace('/(auth)/login');
};
```

**After (With Clerk):**
```tsx
import { useClerk } from '@clerk/clerk-expo';

const { signOut } = useClerk();

const handleLogout = async () => {
  await signOut();
  router.replace('/(auth)/login');
};
```

Or just use the component:
```tsx
import { SignOutButton } from '../../components/SignOutButton';

// In your JSX:
<SignOutButton />
```

## 🎨 Full Styled Example

```tsx
import { useClerk } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const StyledSignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <TouchableOpacity onPress={async () => {
      await signOut();
      router.replace('/(auth)/login');
    }}>
      <LinearGradient
        colors={['#FF6B6B', '#FF3B30']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <MaterialCommunityIcons name="logout" size={22} color="#fff" />
        <Text style={styles.text}>Sign Out</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};
```

## ✅ Ready to Use!

Your `SignOutButton` component is ready. Just import and use it anywhere in your app!
