import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native'; // Add these imports
import { initDB } from '../database/db';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        setDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbReady(true); // Still set to true to avoid blocking the app
      }
    };

    initializeDB();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="AddProject" options={{ title: 'Add Project' }} />
      <Stack.Screen name="ProjectDetails" options={{ title: 'Project Details' }} />
    </Stack>
  );
}