import { Redirect } from 'expo-router';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import { useAccount } from '../context/AuthContext';
import { authDestination } from '../services/routePolicy';
import { SignOutButton } from '../components/SignOutButton';
import { useIdentity } from '../context/IdentityContext';

export default function Index() {
  const { user, loading, error, retry } = useAccount();
  const identity = useIdentity();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
    <Text>{error}</Text><Button title="Retry" onPress={retry} /><SignOutButton />
  </View>;
  if (identity.isSignedIn && !identity.accessVerified) return <Redirect href="/(auth)/verify-email" />;
  return <Redirect href={authDestination(!!user, !!user) || '/(auth)/login'} />;
}
