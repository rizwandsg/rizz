import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Clerk sign-in
    router.replace('/(auth)/clerk-signin');
  }, [router]);

  return null;
}
