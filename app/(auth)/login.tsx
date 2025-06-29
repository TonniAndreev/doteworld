import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
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
          <View style={styles.topSection}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300' }}
              style={styles.backgroundImage}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              style={styles.gradient}
            />
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Paw size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>DogTerritory</Text>
              <Text style={styles.tagline}>Walk. Conquer. Connect.</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitleText}>Sign in to continue your adventure</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
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

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.noAccountText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerText}>Sign Up</Text>
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
  },
  topSection: {
    height: 300,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    width: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    padding: 24,
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray700,
    marginRight: 4,
  },
  registerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.primary,
  },
});