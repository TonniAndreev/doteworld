import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { User, Mail, Phone, Lock, CircleAlert as AlertCircle, ChevronLeft, ChevronRight, CircleCheck as CheckCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDogOwnership } from '@/hooks/useDogOwnership';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationCompletedSuccessfully, setRegistrationCompletedSuccessfully] = useState(false);
  
  const { user, register } = useAuth();
  const { acceptInvite } = useDogOwnership();
  const params = useLocalSearchParams();
  
  // Check if this is an invite flow
  const isInviteFlow = params.inviteToken && params.dogName && params.role;

  useEffect(() => {
    if (isInviteFlow) {
      console.log('Registration with invite context:', params);
    }
  }, [isInviteFlow, params]);

  // Watch for user to be loaded after successful registration
  useEffect(() => {
    if (registrationCompletedSuccessfully && user) {
      console.log('User profile loaded after registration, proceeding with navigation');
      
      if (isInviteFlow) {
        handlePostRegistrationInvite();
      } else {
        router.replace('/(auth)/dog-profile');
      }
    }
  }, [registrationCompletedSuccessfully, user]);

  const handlePostRegistrationInvite = async () => {
    if (!isInviteFlow || !user) return;

    try {
      // Get stored invite data
      const storedInvite = localStorage.getItem('pendingDogInvite');
      if (storedInvite) {
        const inviteData = JSON.parse(storedInvite);
        
        // Accept the invite
        const result = await acceptInvite(inviteData.inviteId || 'mock-invite-id');
        
        if (result.success) {
          Alert.alert(
            'Welcome to Dote!', 
            `You're now a ${inviteData.role} of ${inviteData.dogName}! You can start exploring the app.`,
            [{ text: 'Get Started', onPress: () => router.replace('/(tabs)') }]
          );
        } else {
          Alert.alert('Welcome!', 'Registration successful! You can accept the dog invitation from your profile.');
          router.replace('/(tabs)');
        }
        
        // Clean up stored invite
        localStorage.removeItem('pendingDogInvite');
      }
    } catch (error) {
      console.error('Error handling post-registration invite:', error);
      router.replace('/(tabs)');
    }
  };

  const validateStep1 = () => {
    if (!firstName || !lastName) {
      setError('Please enter your first and last name');
      return false;
    }
    if (!email) {
      setError('Please enter your email address');
      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!phone) {
      setError('Please enter your phone number');
      return false;
    }
    return true;
  };
  
  const validateStep2 = () => {
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };
  
  const nextStep = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleRegister();
    }
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };
  
  const handleRegister = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await register(email, password, firstName, lastName, phone);
      console.log('Registration successful, waiting for user profile to load');
      
      // Set flag to indicate registration was successful
      setRegistrationCompletedSuccessfully(true);
      
      // Note: Navigation to dog profile or invite handling will happen in the useEffect
      // when the user object is available in the AuthContext
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Registration failed. Please try again.');
      setRegistrationCompletedSuccessfully(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle size={64} color={COLORS.success} />
          <Text style={styles.successTitle}>Check Your Email!</Text>
          <Text style={styles.successMessage}>
            We've sent a confirmation link to {email}. Please click the link in your email to verify your account and complete the registration process.
          </Text>
          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <ChevronLeft size={24} color={COLORS.neutralDark} />
          </TouchableOpacity>
        )}
        
        <Text style={styles.headerTitle}>
          {isInviteFlow ? 'Join Dote' : 'Create Account'}
        </Text>
        
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]} />
          <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]} />
        </View>
      </View>

      {/* Invite Context Banner */}
      {isInviteFlow && (
        <View style={styles.inviteBanner}>
          <Text style={styles.inviteBannerText}>
            Create account to accept invitation for {params.dogName} as {params.role}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          {step === 1 && (
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>Personal Information</Text>

              <View style={styles.inputWrapper}>
                <User size={20} color={COLORS.neutralMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>

              <View style={styles.inputWrapper}>
                <User size={20} color={COLORS.neutralMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={20} color={COLORS.neutralMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Phone size={20} color={COLORS.neutralMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>
            </View>
          )}
          
          {step === 2 && (
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>Create Password</Text>

              <View style={styles.inputWrapper}>
                <Lock size={20} color={COLORS.neutralMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color={COLORS.neutralMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>

              <Text style={styles.passwordRequirements}>
                Password must be at least 6 characters
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={nextStep}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === 1 ? 'Continue' : (isInviteFlow ? 'Create Account & Accept' : 'Create Account')}
                </Text>
                {step === 1 && (
                  <ChevronRight size={20} color={COLORS.white} />
                )}
              </>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.haveAccountText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => {
              if (isInviteFlow) {
                router.replace({
                  pathname: '/(auth)/login',
                  params: params
                });
              } else {
                router.replace('/(auth)/login');
              }
            }}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  stepIndicator: {
    flexDirection: 'row',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neutralLight,
    marginHorizontal: 4,
  },
  activeStepDot: {
    backgroundColor: COLORS.primary,
  },
  inviteBanner: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  inviteBannerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
  },
  formContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    padding: 12,
  },
  passwordRequirements: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginTop: 8,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  nextButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginRight: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  haveAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginRight: 4,
  },
  loginText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.primary,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backToLoginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backToLoginText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});