import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Text } from 'react-native';
import { AuthButton, AuthForm, AuthInput } from '../../components/AuthForm';
import { identityError, resetIdentityPassword } from '../../services/firebaseIdentity';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  async function sendReset() {
    if (submitting.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address'); return; }
    submitting.current = true; setLoading(true); setError(null);
    try { await resetIdentityPassword(email.trim()); setSent(true); }
    catch (failure) { const message = identityError(failure); setError(message); Alert.alert('Reset Failed', message); }
    finally { submitting.current = false; setLoading(false); }
  }
  return <AuthForm title="Reset Password" subtitle="Use the secure link sent to your email to choose a new password." error={error}>
    <AuthInput label="Email Address" placeholder="Enter your email" value={email} onChangeText={value => { setEmail(value); setSent(false); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
    {sent ? <Text accessibilityRole="alert">If an account exists for this address, a reset link has been sent. Open it in your email, then return here to sign in.</Text> : null}
    <AuthButton title={sent ? 'Resend Reset Link' : 'Send Reset Link'} loading={loading} onPress={sendReset} />
    <AuthButton title="Back to Sign In" secondary disabled={loading} onPress={() => router.replace('/(auth)/clerk-signin')} />
  </AuthForm>;
}
