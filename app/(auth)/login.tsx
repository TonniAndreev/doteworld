import { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, Facebook, CircleAlert as AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDogOwnership } from '@/hooks/useDogOwnership';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const { acceptInvite } = useDogOwnership();
  const params = useLocalSearchParams();
  
  // Check if this is an invite flow
  const isInviteFlow = params.inviteToken && params.dogName && params.role;

  useEffect(() => {
    if (isInviteFlow) {
      console.log('Login with invite context:', params);
    }
  }, [isInviteFlow, params]);

  const handlePostLoginInvite = async () => {
    if (!isInviteFlow) return;

    try {
      // Get stored invite data
      const storedInvite = localStorage.getItem('pendingDogInvite');
      if (storedInvite) {
        const inviteData = JSON.parse(storedInvite);
        
        // Accept the invite
        const result = await acceptInvite(inviteData.inviteId || 'mock-invite-id');
        
        if (result.success) {
          Alert.alert(
            'Welcome!', 
            `You're now a ${inviteData.role} of ${inviteData.dogName}!`,
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        } else {
          Alert.alert('Error', 'Failed to accept invitation. You can try again from your profile.');
          router.replace('/(tabs)');
        }
        
        // Clean up stored invite
        localStorage.removeItem('pendingDogInvite');
      }
    } catch (error) {
      console.error('Error handling post-login invite:', error);
      router.replace('/(tabs)');
    }
  };
  
  const handleEmailLogin = async () => {
    console.log('🔵 Email login button pressed');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔵 Attempting email login for:', email);
      await login(email, password);
      console.log('🔵 Email login successful, navigating to tabs');
      
      if (isInviteFlow) {
        await handlePostLoginInvite();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      // Log invalid credentials as warning instead of error
      if (error.message && error.message.includes('Invalid login credentials')) {
        console.warn('🟡 Email login attempt with invalid credentials:', error.message);
      } else {
        console.error('🔴 Email login error:', error);
      }
      setError(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    console.log('🟢 Google login button pressed');
    setGoogleLoading(true);
    setError('');
    
    try {
      console.log('🟢 Calling loginWithGoogle function');
      await loginWithGoogle();
      console.log('🟢 Google login completed successfully');
      
      if (isInviteFlow) {
        await handlePostLoginInvite();
      }
      // The auth state change listener will handle navigation after successful login
    } catch (error: any) {
      console.error('🔴 Google login error:', error);
      setError(error.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const handleFacebookLogin = async () => {
    console.log('🔵 Facebook login button pressed');
    setFacebookLoading(true);
    setError('');
    
    try {
      console.log('🔵 Calling loginWithFacebook function');
      await loginWithFacebook();
      console.log('🔵 Facebook login completed successfully');
      
      if (isInviteFlow) {
        await handlePostLoginInvite();
      }
      // The auth state change listener will handle navigation after successful login
    } catch (error: any) {
      console.error('🔴 Facebook login error:', error);
      setError(error.message || 'Facebook login failed');
    } finally {
      setFacebookLoading(false);
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

            {/* Invite Context Banner */}
            {isInviteFlow && (
              <View style={styles.inviteBanner}>
                <Text style={styles.inviteBannerText}>
                  Login to accept invitation for {params.dogName} as {params.role}
                </Text>
              </View>
            )}
            
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
                <Text style={styles.loginButtonText}>
                  {isInviteFlow ? 'Login & Accept Invite' : 'Login'}
                </Text>
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
                disabled={googleLoading || isLoading || facebookLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={COLORS.neutralDark} />
                ) : (
                  <>
                    <Image
                      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]}
                onPress={handleFacebookLogin}
                disabled={facebookLoading || isLoading || googleLoading}
              >
                {facebookLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Facebook size={20} color={COLORS.white} />
                    <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Facebook</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.noAccountText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => {
                if (isInviteFlow) {
                  router.push({
                    pathname: '/(auth)/register',
                    params: params
                  });
                } else {
                  router.push('/(auth)/register');
                }
              }}>
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
  inviteBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
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
    marginBottom: 6, // Further reduced from 6 to 3
    borderWidth: 1,
    borderColor: '#C1C1C1', // Dark gray thin border
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
    borderColor: '#C1C1C1', // Dark gray thin border
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