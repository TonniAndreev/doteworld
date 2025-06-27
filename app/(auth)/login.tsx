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
import { SafeAreaView } from 'react-native-safe-area-context';
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
      {/* Background Map Image */}
      <Image
        source={require('@/assets/images/Map.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Form Container with Blur and Gradient */}
      <View style={styles.formOverlay}>
        {/* Blur Effect */}
        <BlurView intensity={4} style={StyleSheet.absoluteFillObject} />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.8)', '#FFFFFF']}
          locations={[0, 0.3, 0.6]}
          style={StyleSheet.absoluteFillObject}
        />
        
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            {/* Fixed height container to prevent scrolling */}
            <View style={styles.contentContainer}>
              {/* Logo Section - Compact */}
              <View style={styles.logoSection}>
                <Image
                  source={require('@/assets/images/Logo-full-vertical.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              
              {/* Main Form Section */}
              <View style={styles.formSection}>
                {/* Error Display */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={18} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                
                {/* Input Fields */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color={COLORS.neutralMedium} style={styles.inputIcon} />
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
                    <Lock size={18} color={COLORS.neutralMedium} style={styles.inputIcon} />
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
                        <EyeOff size={18} color={COLORS.neutralMedium} />
                      ) : (
                        <Eye size={18} color={COLORS.neutralMedium} />
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
                    <Facebook size={18} color={COLORS.white} />
                    <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Facebook</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Bottom Section */}
              <View style={styles.bottomSection}>
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
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
    height: screenWidth * (3/4),
  },
  formOverlay: {
    flex: 1,
    marginTop: screenHeight * 0.18, // Reduced from 20% to 18% to show more of the logo
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8, // Minimal top padding
    paddingBottom: 16,
    justifyContent: 'space-between', // Distribute sections evenly
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 8, // Minimal padding around logo
  },
  logoImage: {
    width: 70, // Slightly smaller logo
    height: 70,
  },
  formSection: {
    flex: 1, // Take up most of the space
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: COLORS.error,
    marginLeft: 6,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: COLORS.neutralDark,
    paddingVertical: 12, // Reduced padding
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: COLORS.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14, // Slightly reduced
    alignItems: 'center',
    marginBottom: 14,
  },
  loginButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.neutralLight,
  },
  orText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: COLORS.neutralMedium,
    marginHorizontal: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // Reduced padding
    borderRadius: 12,
    width: '48%',
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  socialButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: COLORS.neutralDark,
  },
  facebookButtonText: {
    color: COLORS.white,
    marginLeft: 6,
  },
  bottomSection: {
    alignItems: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.neutralDark,
    marginRight: 4,
  },
  registerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    color: COLORS.primary,
  },
  boltNewContainer: {
    alignItems: 'center',
  },
  boltNewImage: {
    width: 140, // Smaller to fit better
    height: 42,
  },
});