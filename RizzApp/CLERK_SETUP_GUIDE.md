# Clerk Authentication Setup Guide

## ✅ Step 1: Packages Installed
- `@clerk/clerk-expo` ✓
- `expo-secure-store` ✓
- `expo-web-browser` ✓

## 📋 Step 2: Get Your Clerk API Keys

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign up or log in
3. Create a new application
4. Go to **API Keys** section
5. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
6. Update the `.env` file with your key:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```

## 🔧 Step 3: Wrap Your App with ClerkProvider

Update your `app/_layout.tsx`:

```tsx
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        {/* Your existing app code */}
        <ThemeProvider>
          <ProtectedRoute>
            {/* ... rest of your app */}
          </ProtectedRoute>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

## 🔐 Step 4: Create Clerk Sign-In Screen

Create a new file `app/(auth)/clerk-login.tsx`:

```tsx
import { useSignIn } from '@clerk/clerk-expo';
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function ClerkLogin() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View>
      <TextInput
        autoCapitalize="none"
        value={email}
        placeholder="Email..."
        onChangeText={setEmail}
      />
      <TextInput
        value={password}
        placeholder="Password..."
        secureTextEntry={true}
        onChangeText={setPassword}
      />
      <Button title="Sign In" onPress={onSignInPress} />
    </View>
  );
}
```

## 🔐 Step 5: Create Clerk Sign-Up Screen

Create a new file `app/(auth)/clerk-signup.tsx`:

```tsx
import { useSignUp } from '@clerk/clerk-expo';
import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function ClerkSignup() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View>
      {!pendingVerification && (
        <>
          <TextInput
            autoCapitalize="none"
            value={email}
            placeholder="Email..."
            onChangeText={setEmail}
          />
          <TextInput
            value={password}
            placeholder="Password..."
            secureTextEntry={true}
            onChangeText={setPassword}
          />
          <Button title="Sign Up" onPress={onSignUpPress} />
        </>
      )}
      {pendingVerification && (
        <>
          <TextInput
            value={code}
            placeholder="Code..."
            onChangeText={setCode}
          />
          <Button title="Verify Email" onPress={onPressVerify} />
        </>
      )}
    </View>
  );
}
```

## 🛡️ Step 6: Protect Routes with Clerk

Update your `ProtectedRoute` component to use Clerk:

```tsx
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/clerk-login');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [isSignedIn, segments, isLoaded]);

  return <>{children}</>;
}
```

## 👤 Step 7: Get User Data

Use Clerk hooks anywhere in your app:

```tsx
import { useUser } from '@clerk/clerk-expo';

export default function Profile() {
  const { user } = useUser();

  return (
    <View>
      <Text>Welcome {user?.firstName}</Text>
      <Text>{user?.emailAddresses[0].emailAddress}</Text>
    </View>
  );
}
```

## 🚪 Step 8: Sign Out

```tsx
import { useAuth } from '@clerk/clerk-expo';

export default function SignOut() {
  const { signOut } = useAuth();

  return (
    <Button title="Sign Out" onPress={() => signOut()} />
  );
}
```

## 📱 Step 9: OAuth Providers (Optional)

To add Google, GitHub, etc.:

1. In Clerk Dashboard → **User & Authentication** → **Social Connections**
2. Enable providers (Google, GitHub, etc.)
3. Add to your login screen:

```tsx
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthLogin() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onPress = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  };

  return <Button title="Sign in with Google" onPress={onPress} />;
}
```

## 🔄 Step 10: Restart Your Dev Server

```bash
npx expo start -c
```

## 📚 Useful Clerk Hooks

- `useAuth()` - Get authentication state
- `useUser()` - Get current user data
- `useSignIn()` - Sign in functionality
- `useSignUp()` - Sign up functionality
- `useOAuth()` - OAuth providers
- `useSessionList()` - Manage sessions
- `useClerk()` - Access Clerk instance

## 🎨 Customize Clerk Components

In Clerk Dashboard:
- Go to **Customization**
- Customize colors, logos, text
- Match your app's theme

## 🔗 Resources

- [Clerk Expo Documentation](https://clerk.com/docs/quickstarts/expo)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Clerk API Reference](https://clerk.com/docs/references/expo/overview)

## ⚠️ Important Notes

1. **Environment Variables**: Make sure to restart your dev server after updating `.env`
2. **Token Cache**: Clerk needs `expo-secure-store` for token persistence
3. **Web Browser**: Required for OAuth flows
4. **Publishable Key**: Never use your secret key in the app, only the publishable key
5. **Production**: Switch to `pk_live_` key when deploying

## 🚀 Next Steps

1. Get your Clerk publishable key
2. Update `.env` file
3. Wrap your app with `ClerkProvider`
4. Create login/signup screens
5. Test the authentication flow
6. Customize the UI to match your app
