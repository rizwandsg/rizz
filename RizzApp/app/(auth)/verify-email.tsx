import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { AuthButton, AuthForm } from '../../components/AuthForm';
import { useIdentity } from '../../context/IdentityContext';
import { identityError, refreshIdentity, sendVerificationEmail } from '../../services/firebaseIdentity';

export default function VerifyEmailScreen() {
  const identity = useIdentity();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  async function act(operation: () => Promise<void>) {
    if (submitting.current) return;
    submitting.current = true; setLoading(true); setError(null);
    try { await operation(); } catch (failure) { setError(identityError(failure)); }
    finally { submitting.current = false; setLoading(false); }
  }
  if (identity.isLoaded && !identity.isSignedIn) return <Redirect href="/(auth)/clerk-signin" />;
  if (identity.accessVerified) return <Redirect href="/" />;
  return <AuthForm title="Verify Email" subtitle="Send a verification email, open its link, then return here to continue." error={error}>
    <Text>{identity.email}</Text>
    {message ? <Text accessibilityRole="alert">{message}</Text> : null}
    <AuthButton title="Send Verification Email" loading={loading} disabled={!identity.isLoaded} onPress={() => act(async () => {
      await sendVerificationEmail(); setMessage('Verification email sent. Check your inbox and spam folder.');
    })} />
    <AuthButton title="I Have Verified My Email" secondary disabled={loading || !identity.isLoaded} onPress={() => act(async () => {
      if (await refreshIdentity()) router.replace('/');
      else setError('Your email is not verified yet. Open the verification link and try again.');
    })} />
    <AuthButton title="Sign Out" secondary disabled={loading} onPress={() => act(async () => { await identity.signOut(); router.replace('/(auth)/clerk-signin'); })} />
  </AuthForm>;
}
