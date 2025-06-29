import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show welcome page for web users
  if (Platform.OS === 'web') {
    return <Redirect href="/welcome" />;
  }

  // During initial loading, don't redirect
  if (isLoading) {
    return null;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}