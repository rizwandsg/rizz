import { Stack } from 'expo-router';
import ProtectedRoute from '../components/ProtectedRoute';

export default function RootLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
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
        <Stack.Screen name="AddExpense" options={{ title: "Add Expense" }} />
        <Stack.Screen name="AddProject" options={{ title: "Add Project" }} />
        <Stack.Screen name="ProjectDetails" options={{ title: "Project Details" }} />
      </Stack>
    </ProtectedRoute>
  );
}