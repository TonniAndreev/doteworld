import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await signUp(email, password, username);
      
      if (error) {
        setError(error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={COLORS.dark} />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Paw size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>DogTerritory</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitleText}>Join our community of dog walkers</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color={COLORS.gray600} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.gray500}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={20} color={COLORS.gray600} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.gray500}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color={COLORS.gray600} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={COLORS.gray500}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.gray600} />
                  ) : (
                    <Eye size={20} color={COLORS.gray600} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color={COLORS.gray600} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor={COLORS.gray500}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={COLORS.gray600} />
                  ) : (
                    <Eye size={20} color={COLORS.gray600} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.haveAccountText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Paw(props: { size: number; color: string }) {
  return (
    <View style={{ width: props.size, height: props.size }}>
      <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.83 13.38a3.1 3.1 0 0 0-1.66 0 3.11 3.11 0 0 0-2 2.83V21h5.66v-4.79a3.11 3.11 0 0 0-2-2.83Z" />
        <path d="M21.33 17.33A6.78 6.78 0 0 0 20.1 15a6.82 6.82 0 0 0-3.76-1.85c-.29-.04-.58-.15-.85-.35a3 3 0 0 1-1.2-1.8 3 3 0 0 1 .34-2.16 3 3 0 0 1 1.8-1.2c.27-.1.56-.17.85-.35a6.82 6.82 0 0 0 3.76-1.85 6.78 6.78 0 0 0 1.23-2.33" />
        <path d="M2.67 17.33A6.78 6.78 0 0 1 3.9 15a6.82 6.82 0 0 1 3.76-1.85c.29-.04.58-.15.85-.35a3 3 0 0 0 1.2-1.8 3 3 0 0 0-.34-2.16 3 3 0 0 0-1.8-1.2c-.27-.1-.56-.17-.85-.35A6.82 6.82 0 0 1 3.9 5.44a6.78 6.78 0 0 1-1.23-2.33" />
      </svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.dark,
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.gray600,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  haveAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray700,
    marginRight: 4,
  },
  loginText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.primary,
  },
});