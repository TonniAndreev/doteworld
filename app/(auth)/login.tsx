import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Facebook, CircleAlert as AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  
  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithFacebook();
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message || 'Facebook login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoltNewPress = () => {
    Linking.openURL('https://bolt.new');
  };

  return (
    <View style={styles.container}>
      {/* Background Map Image - Maintains aspect ratio, starts from top */}
      <Image
        source={require('@/assets/images/Map.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
        height="60%"
      />
      
      {/* Overlapping Form Container with Blur and Gradient */}
      <View style={styles.formOverlay}>
        {/* Blur Effect */}
        <BlurView intensity={4} style={StyleSheet.absoluteFillObject} />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.8)', '#FFFFFF']}
          locations={[0, 0.3, 0.6]}
          style={StyleSheet.absoluteFillObject}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/Logo-full-vertical.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Error Display */}
            {error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {/* Input Fields */}
            <View style={styles.inputContainer}>
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
                <Lock size={20} color={COLORS.neutralMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={COLORS.neutralMedium}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.neutralMedium} />
                  ) : (
                    <Eye size={20} color={COLORS.neutralMedium} />
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            
            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            {/* OR Divider */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
            
            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]}
                onPress={handleFacebookLogin}
                disabled={isLoading}
              >
                <Facebook size={20} color={COLORS.white} />
                <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Facebook</Text>
              </TouchableOpacity>
            </View>
            
            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.noAccountText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Bolt.new Attribution */}
            <TouchableOpacity 
              style={styles.boltNewContainer}
              onPress={handleBoltNewPress}
            >
              <Image
                source={require('@/assets/images/white_circle_360x360.png')}
                style={styles.boltNewImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenWidth * (3/4), // Assuming a 4:3 aspect ratio for the map image
  },
  formOverlay: {
    flex: 1,
    marginTop: screenHeight * 0.25, // Pushed down more to show more of the background
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    overflow: 'hidden',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 4, // Further reduced from 8 to 4
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 4, // Further reduced from 8 to 4
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 4, // Further reduced from 8 to 4
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 3, // Further reduced from 6 to 3
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    paddingVertical: 14,
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
    marginBottom: 4, // Further reduced from 8 to 4
  },
  loginButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.neutralLight,
  },
  orText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginHorizontal: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5, // Further reduced from 10 to 5
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    width: '48%',
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  socialButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  facebookButtonText: {
    color: COLORS.white,
    marginLeft: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4, // Further reduced from 8 to 4
  },
  noAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginRight: 4,
  },
  registerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.primary,
  },
  boltNewContainer: {
    alignItems: 'center',
    paddingVertical: 2, // Further reduced from 4 to 2
  },
  boltNewImage: {
    width: 180,
    height: 54,
  },
});