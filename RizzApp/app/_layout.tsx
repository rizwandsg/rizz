import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { initGoogleDrive } from '../services/googleDriveService';

export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await initGoogleDrive();
        setStorageReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
      }
    };

    initializeStorage();
  }, []);

  if (!storageReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing storage...</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="AddExpense" options={{ title: "Add Expense" }} />
      <Stack.Screen name="AddProject" options={{ title: "Add Project" }} />
    </Stack>
  );

  return <Stack />;
}