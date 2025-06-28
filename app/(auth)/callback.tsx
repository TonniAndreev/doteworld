import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback params:', params);

        const access_token = params.access_token as string;
        const refresh_token = params.refresh_token as string;
        const error = params.error as string;
        const error_description = params.error_description as string;

        if (error) {
          console.error('OAuth error:', error, error_description);
          router.replace('/(auth)/login');
          return;
        }

        if (access_token && refresh_token) {
          console.log('Setting session with tokens from callback');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            router.replace('/(auth)/login');
            return;
          }

          if (data.user) {
            console.log('OAuth login successful, redirecting to app');
            router.replace('/(tabs)');
          } else {
            console.error('No user data received');
            router.replace('/(auth)/login');
          }
        } else {
          console.error('No tokens received in callback');
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleAuthCallback();
  }, [params]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.text}>Completing authentication...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 16,
    textAlign: 'center',
  },
});