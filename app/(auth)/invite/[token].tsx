import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Crown, Shield, Eye, UserPlus, ArrowRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { getDogAvatarSource } from '@/utils/dogAvatarUtils';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [inviteData, setInviteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      parseInviteToken();
    }
  }, [token]);

  const parseInviteToken = () => {
    try {
      // Parse the invite token to extract dog information
      // In a real implementation, you'd validate this token with your backend
      const urlParams = new URLSearchParams(window.location.search);
      const dogId = urlParams.get('dogId');
      const dogName = urlParams.get('dogName');
      const role = urlParams.get('role');

      if (!dogId || !dogName || !role) {
        setError('Invalid invite link');
        setIsLoading(false);
        return;
      }

      setInviteData({
        dogId,
        dogName: decodeURIComponent(dogName),
        role,
        inviterName: 'Dog Owner', // This would come from the backend
        dogBreed: 'Golden Retriever', // This would come from the backend
      });
    } catch (error) {
      setError('Invalid invite link');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'co-owner':
        return <Shield size={32} color={COLORS.primary} />;
      case 'caretaker':
        return <Eye size={32} color={COLORS.secondary} />;
      default:
        return <Crown size={32} color={COLORS.accent} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'co-owner':
        return COLORS.primary;
      case 'caretaker':
        return COLORS.secondary;
      default:
        return COLORS.accent;
    }
  };

  const handleAcceptInvite = () => {
    // Store invite data for use after registration
    if (inviteData) {
      // In a real app, you'd store this securely
      localStorage.setItem('pendingDogInvite', JSON.stringify(inviteData));
    }
    
    // Navigate to registration with invite context
    router.push({
      pathname: '/(auth)/register',
      params: { 
        inviteToken: token,
        dogName: inviteData?.dogName,
        role: inviteData?.role 
      }
    });
  };

  const handleLogin = () => {
    // Store invite data for use after login
    if (inviteData) {
      localStorage.setItem('pendingDogInvite', JSON.stringify(inviteData));
    }
    
    // Navigate to login with invite context
    router.push({
      pathname: '/(auth)/login',
      params: { 
        inviteToken: token,
        dogName: inviteData?.dogName,
        role: inviteData?.role 
      }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading invitation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !inviteData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Invalid Invitation</Text>
          <Text style={styles.errorText}>
            This invitation link is invalid or has expired.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/Logo-full-vertical.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>You're Invited!</Text>
          <Text style={styles.headerSubtitle}>
            Join Dote to help care for a furry friend
          </Text>
        </View>

        {/* Invitation Card */}
        <View style={styles.inviteCard}>
          {/* Dog Avatar */}
          <View style={styles.dogAvatarContainer}>
            <Image 
              source={getDogAvatarSource(inviteData.dogId, null, inviteData.dogBreed)}
              style={styles.dogAvatar}
              resizeMode="cover"
            />
          </View>

          {/* Invitation Details */}
          <View style={styles.inviteDetails}>
            <Text style={styles.dogName}>{inviteData.dogName}</Text>
            <Text style={styles.dogBreed}>{inviteData.dogBreed}</Text>
            
            <View style={styles.roleContainer}>
              {getRoleIcon(inviteData.role)}
              <Text style={[styles.roleText, { color: getRoleColor(inviteData.role) }]}>
                {inviteData.role.charAt(0).toUpperCase() + inviteData.role.slice(1)}
              </Text>
            </View>

            <Text style={styles.inviteMessage}>
              {inviteData.inviterName} has invited you to be a {inviteData.role} of {inviteData.dogName}
            </Text>
          </View>

          {/* Role Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>As a {inviteData.role}, you'll be able to:</Text>
            
            {inviteData.role === 'co-owner' ? (
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Shield size={16} color={COLORS.success} />
                  <Text style={styles.benefitText}>View and edit {inviteData.dogName}'s profile</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Shield size={16} color={COLORS.success} />
                  <Text style={styles.benefitText}>Track walks and territory conquests</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Shield size={16} color={COLORS.success} />
                  <Text style={styles.benefitText}>Invite other caretakers</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Shield size={16} color={COLORS.success} />
                  <Text style={styles.benefitText}>Manage dog ownership settings</Text>
                </View>
              </View>
            ) : (
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Eye size={16} color={COLORS.success} />
                  <Text style={styles.benefitText}>View {inviteData.dogName}'s profile and stats</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Eye size={16} color={COLORS.success} />
                  <Text style={styles.benefitText}>See walk history and achievements</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Eye size={16} color={COLORS.success} />
                  <Text style={styles.benefitText}>Track territory conquests</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleAcceptInvite}
          >
            <UserPlus size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Create Account & Accept</Text>
            <ArrowRight size={20} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleLogin}
          >
            <Text style={styles.secondaryButtonText}>Login & Accept Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By accepting this invitation, you'll join the Dote community and help make dog walking more fun and social.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
  inviteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  dogAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dogAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  inviteDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dogName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  dogBreed: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  roleText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  inviteMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    flex: 1,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.neutralLight,
  },
  dividerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
});