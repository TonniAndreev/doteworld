import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';

export default function ConfirmScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Extract tokens from URL parameters
        const access_token = params.access_token as string;
        const refresh_token = params.refresh_token as string;
        const type = params.type as string;

        console.log('Confirmation params:', { access_token: !!access_token, refresh_token: !!refresh_token, type });

        if (!access_token || !refresh_token) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please try again.');
          return;
        }

        // Set the session using the tokens from the email link
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Session error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email. Please try again.');
          return;
        }

        if (data.user) {
          console.log('Email confirmed successfully for user:', data.user.id);
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting...');
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No user found. Please try again.');
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleEmailConfirmation();
  }, [params]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <ActivityIndicator size="large" color={COLORS.primary} />;
      case 'success':
        return <Check size={64} color={COLORS.success} />;
      case 'error':
        return <AlertCircle size={64} color={COLORS.error} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      default:
        return COLORS.neutralDark;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {getStatusIcon()}
        </View>
        
        <Text style={styles.title}>
          {status === 'loading' && 'Confirming Email...'}
          {status === 'success' && 'Email Confirmed!'}
          {status === 'error' && 'Confirmation Failed'}
        </Text>
        
        <Text style={[styles.message, { color: getStatusColor() }]}>
          {message}
        </Text>
        
        {status === 'error' && (
          <Text style={styles.helpText}>
            If you continue to have issues, please contact support or try registering again.
          </Text>
        )}
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
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  helpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
});