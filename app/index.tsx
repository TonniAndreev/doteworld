import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('Index: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // During initial loading, don't redirect
  if (isLoading) {
    console.log('Index: Still loading, showing nothing');
    return null;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    console.log('Index: User authenticated, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('Index: User not authenticated, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }
}