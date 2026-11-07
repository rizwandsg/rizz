import { logout } from '../api/authApi';
import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const submitting = useRef(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      await signOut();
      await logout();
      // Redirect to login page
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Sign Out Failed', 'Unable to finish signing out. Check your connection and try again.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handleSignOut} disabled={loading} style={styles.button}>
      <Text style={styles.text}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
