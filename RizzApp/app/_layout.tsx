import { Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAccount } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { nativeHeaderTitles, protectedScreens, routeAccess } from '../services/routePolicy';

function Navigator() {
  const router = useRouter();
  const { user, loading, error } = useAccount();
  const access = routeAccess(!!user, loading, !!error);
  // Always mount the root navigator. Guards remove private routes before their screens run.
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Protected guard={access.public}><Stack.Screen name="(auth)" /></Stack.Protected>
    <Stack.Protected guard={access.private}>
      {protectedScreens.map(name => <Stack.Screen key={name} name={name} options={nativeHeaderTitles[name] ? {
        headerShown: true, title: nativeHeaderTitles[name],
        headerLeft: () => <Pressable accessibilityRole="button" accessibilityLabel="Back to projects" style={{padding: 8}}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}><Text>Back</Text></Pressable>,
      } : {headerShown: false}} />)}
    </Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><AuthProvider>
      <Navigator />
    </AuthProvider></ThemeProvider></SafeAreaProvider>;
}
