import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProtectedRoute from '../components/ProtectedRoute';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}