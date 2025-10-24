import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function SignupScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Clerk sign-up
    router.replace('/(auth)/clerk-signup');
  }, [router]);

  return null;
}
