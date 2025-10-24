import { useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { isAuthenticated } from '../api/authApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const hasRedirectedRef = useRef(false); // Prevent multiple redirects
  const majorSection = segments[0]; // Extract for dependency

  const checkAuth = useCallback(async () => {
    // Skip if we've already redirected
    if (hasRedirectedRef.current) {
      setLoading(false);
      return;
    }

    try {
      const isAuth = await isAuthenticated();
      const inAuthGroup = majorSection === '(auth)';
      
      // Get the current route path as a string to check which page we're on
      const currentRoute = segments.join('/');

      if (!isAuth && !inAuthGroup) {
        // User is not authenticated and not in auth pages, redirect to login
        hasRedirectedRef.current = true;
        router.replace('/(auth)/login');
      } else if (isAuth && inAuthGroup && !currentRoute.includes('clerk-signin') && !currentRoute.includes('clerk-signup')) {
        // User is authenticated but in auth pages (and not actively signing in), redirect to tabs
        hasRedirectedRef.current = true;
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      hasRedirectedRef.current = true;
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  }, [router, majorSection, segments]);

  useEffect(() => {
    // Only run checkAuth on mount or when major section changes
    if (majorSection && !hasRedirectedRef.current) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [majorSection, checkAuth]); // Depend on major section only

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