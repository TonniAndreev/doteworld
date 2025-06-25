import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Award, Users, PawPrint, Download, Smartphone, Apple } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { Platform } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleDownload = (platform: 'ios' | 'android') => {
    if (Platform.OS === 'web') {
      // In production, these would be actual App Store/Play Store links
      const urls = {
        ios: 'https://apps.apple.com/app/dote-dog-walking/id123456789',
        android: 'https://play.google.com/store/apps/details?id=com.dote.app'
      };
      
      // For now, show an alert since the app isn't published yet
      alert(`Download link for ${platform === 'ios' ? 'iOS' : 'Android'} coming soon!`);
      // window.open(urls[platform], '_blank');
    }
  };

  const features = [
    {
      icon: <MapPin size={32} color={COLORS.primary} />,
      title: 'Territory Conquest',
      description: 'Walk with your dog to claim and expand your territory on an interactive map'
    },
    {
      icon: <PawPrint size={32} color={COLORS.secondary} />,
      title: 'Paws Currency',
      description: 'Earn paws for walking and use them to unlock new conquests and rewards'
    },
    {
      icon: <Award size={32} color={COLORS.accent} />,
      title: 'Achievements',
      description: 'Unlock badges and achievements for various walking milestones and challenges'
    },
    {
      icon: <Users size={32} color={COLORS.tertiary} />,
      title: 'Social Features',
      description: 'Connect with other dog walkers, compete on leaderboards, and share achievements'
    }
  ];

  const screenshots = [
    {
      url: 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=300&h=600',
      title: 'Interactive Map'
    },
    {
      url: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=300&h=600',
      title: 'Achievement System'
    },
    {
      url: 'https://images.pexels.com/photos/4498364/pexels-photo-4498364.jpeg?auto=compress&cs=tinysrgb&w=300&h=600',
      title: 'Social Features'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/Logo-full-vertical.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.heroTitle}>
            Turn Dog Walking Into an Adventure
          </Text>
          
          <Text style={styles.heroSubtitle}>
            Conquer territories, earn rewards, and connect with fellow dog lovers in the ultimate dog walking experience.
          </Text>

          <View style={styles.downloadSection}>
            <Text style={styles.downloadTitle}>Download the App</Text>
            
            <View style={styles.downloadButtons}>
              <TouchableOpacity 
                style={[styles.downloadButton, styles.iosButton]}
                onPress={() => handleDownload('ios')}
              >
                <Apple size={24} color={COLORS.white} />
                <View style={styles.downloadButtonText}>
                  <Text style={styles.downloadButtonLabel}>Download on the</Text>
                  <Text style={styles.downloadButtonStore}>App Store</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.downloadButton, styles.androidButton]}
                onPress={() => handleDownload('android')}
              >
                <Smartphone size={24} color={COLORS.white} />
                <View style={styles.downloadButtonText}>
                  <Text style={styles.downloadButtonLabel}>Get it on</Text>
                  <Text style={styles.downloadButtonStore}>Google Play</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Dog Walkers Love Dote</Text>
          
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  {feature.icon}
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Screenshots Section */}
        <View style={styles.screenshotsSection}>
          <Text style={styles.sectionTitle}>See It In Action</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.screenshotsContainer}
          >
            {screenshots.map((screenshot, index) => (
              <View key={index} style={styles.screenshotCard}>
                <Image
                  source={{ uri: screenshot.url }}
                  style={styles.screenshotImage}
                  resizeMode="cover"
                />
                <Text style={styles.screenshotTitle}>{screenshot.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Join the Pack</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Walkers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Territories Claimed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>100K+</Text>
              <Text style={styles.statLabel}>Miles Walked</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Ready to Start Your Adventure?</Text>
            <Text style={styles.ctaSubtitle}>
              Download Dote today and transform your daily dog walks into exciting territory conquests!
            </Text>
            
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => handleDownload('ios')}
            >
              <Download size={20} color={COLORS.white} />
              <Text style={styles.ctaButtonText}>Download Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Dote. Made with ❤️ for dog lovers everywhere.
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.secondaryLight} 100%)`,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
    maxWidth: 600,
  },
  downloadSection: {
    alignItems: 'center',
    width: '100%',
  },
  downloadTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 24,
  },
  downloadButtons: {
    flexDirection: screenWidth > 600 ? 'row' : 'column',
    gap: 16,
    alignItems: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iosButton: {
    backgroundColor: COLORS.neutralDark,
  },
  androidButton: {
    backgroundColor: COLORS.primary,
  },
  downloadButtonText: {
    marginLeft: 12,
  },
  downloadButtonLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },
  downloadButtonStore: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginBottom: 48,
  },
  featuresGrid: {
    flexDirection: screenWidth > 800 ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  featureCard: {
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: screenWidth > 800 ? '45%' : '100%',
    maxWidth: 400,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.neutralExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 24,
  },
  screenshotsSection: {
    paddingVertical: 80,
    backgroundColor: COLORS.neutralExtraLight,
  },
  screenshotsContainer: {
    paddingHorizontal: 24,
    gap: 24,
  },
  screenshotCard: {
    alignItems: 'center',
  },
  screenshotImage: {
    width: 200,
    height: 400,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  screenshotTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  statsSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
  },
  statsGrid: {
    flexDirection: screenWidth > 600 ? 'row' : 'column',
    justifyContent: 'space-around',
    gap: 32,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: COLORS.white,
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: COLORS.neutralDark,
    alignItems: 'center',
  },
  ctaContent: {
    alignItems: 'center',
    maxWidth: 600,
  },
  ctaTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.white,
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: COLORS.neutralExtraLight,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
});