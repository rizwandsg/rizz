import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  // If user is already signed in, redirect to home
  if (isSignedIn) {
    return <Redirect href={'/(tabs)/home'} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="clerk-signin" />
      <Stack.Screen name="clerk-signup" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}