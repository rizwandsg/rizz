import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProtectedRoute from '../components/ProtectedRoute';
import { ThemeProvider } from '../context/ThemeContext';

// Suppress Clerk development key warning (normal for development)
LogBox.ignoreLogs([
  'Clerk: Clerk has been loaded with development keys',
]);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env file');
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ThemeProvider>
            <ProtectedRoute>
              <Stack screenOptions={{
                headerShown: false,
                headerStyle: {
                  backgroundColor: '#fff',
                },
                headerShadowVisible: false,
                headerTintColor: '#000',
                headerTitleStyle: {
                  fontWeight: '600',
                },
              }}>
                <Stack.Screen 
                  name="(auth)" 
                  options={{ 
                    headerShown: false 
                  }} 
                />
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ 
                    headerShown: false 
                  }} 
                />
                <Stack.Screen 
                  name="AddExpense" 
                  options={{ 
                    title: "Add Expense",
                    headerShown: false,
                  }} 
                />
                <Stack.Screen 
                  name="AddProject" 
                  options={{ 
                    title: "Add Project",
                    headerShown: false,
                  }} 
                />
                <Stack.Screen 
                  name="ProjectDetails" 
                  options={{ 
                    title: "Project Details",
                    headerShown: false,
                  }} 
                />
                <Stack.Screen 
                  name="ExpenseDetails" 
                  options={{ 
                    title: "Expense Details",
                    headerShown: false,
                  }} 
                />
              </Stack>
            </ProtectedRoute>
          </ThemeProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}