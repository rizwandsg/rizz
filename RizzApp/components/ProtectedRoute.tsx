import { useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { isAuthenticated } from '../api/authApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const isAuth = await isAuthenticated();

      const inAuthGroup = segments[0] === '(auth)';

      if (!isAuth && !inAuthGroup) {
        // User is not authenticated and not in auth pages, redirect to login
        router.replace('/(auth)/login');
      } else if (isAuth && inAuthGroup) {
        // User is authenticated but in auth pages, redirect to tabs
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  }, [router, segments]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});