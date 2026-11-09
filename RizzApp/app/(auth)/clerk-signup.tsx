import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { AuthButton, AuthForm, AuthInput } from '../../components/AuthForm';
import { useIdentity } from '../../context/IdentityContext';
import { identityError, signUpIdentity } from '../../services/firebaseIdentity';

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded } = useIdentity();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  function fail(message: string) { setError(message); Alert.alert('Sign Up Failed', message); }
  async function createAccount() {
    if (!isLoaded || submitting.current) return;
    if (!fullName.trim()) { fail('Please enter your full name'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { fail('Please enter a valid email address'); return; }
    if (password.length < 8 || password.length > 128) { fail('Password must contain 8 to 128 characters'); return; }
    submitting.current = true; setLoading(true); setError(null);
    try {
      await signUpIdentity(email.trim(), password, fullName.trim().replace(/\s+/g, ' '));
      setPassword(''); router.replace('/(auth)/verify-email');
    } catch (failure) { fail(identityError(failure)); }
    finally { submitting.current = false; setLoading(false); }
  }
  return <AuthForm title="Create Account" subtitle="Create your workspace with a verified email address." error={error}>
    <AuthInput label="Full Name" placeholder="Enter your full name" value={fullName} onChangeText={setFullName} maxLength={200} autoComplete="name" />
    <AuthInput label="Email Address" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
    <AuthInput label="Password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
    <AuthButton title="Create Account" testID="auth-submit" loading={loading} disabled={!isLoaded} onPress={createAccount} />
    <AuthButton title="Already have an account? Sign In" secondary disabled={loading} onPress={() => router.replace('/(auth)/clerk-signin')} />
  </AuthForm>;
}
