import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ExternalLink, Package, Shield, Smartphone, Code, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Download, Settings } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function PackageScreen() {
  const [activeStep, setActiveStep] = useState(0);

  const integrationSteps = [
    {
      title: 'Export Your Project',
      description: 'Download your project to work locally with native dependencies',
      icon: <Download size={24} color={COLORS.primary} />,
      details: [
        'Click "Export" in your Bolt dashboard',
        'Download the project ZIP file',
        'Extract to your preferred development folder'
      ]
    },
    {
      title: 'Install RevenueCat SDK',
      description: 'Add RevenueCat to your project dependencies',
      icon: <Package size={24} color={COLORS.primary} />,
      details: [
        'Run: npx expo install react-native-purchases',
        'Configure your app.json with RevenueCat plugin',
        'Set up your RevenueCat dashboard account'
      ]
    },
    {
      title: 'Configure Products',
      description: 'Set up your subscription products in RevenueCat',
      icon: <Settings size={24} color={COLORS.primary} />,
      details: [
        'Create products in App Store Connect / Google Play Console',
        'Import products to RevenueCat dashboard',
        'Configure entitlements and offerings'
      ]
    },
    {
      title: 'Test & Deploy',
      description: 'Test purchases and deploy to app stores',
      icon: <Smartphone size={24} color={COLORS.primary} />,
      details: [
        'Create development build with Expo Dev Client',
        'Test purchases in sandbox environment',
        'Submit to App Store / Google Play for review'
      ]
    }
  ];

  const features = [
    {
      title: 'Cross-Platform Billing',
      description: 'Handle iOS and Android subscriptions with one SDK',
      icon: <Smartphone size={20} color={COLORS.primary} />
    },
    {
      title: 'Receipt Validation',
      description: 'Automatic server-side receipt validation and fraud protection',
      icon: <Shield size={20} color={COLORS.success} />
    },
    {
      title: 'Analytics & Insights',
      description: 'Detailed subscription analytics and customer insights',
      icon: <CheckCircle size={20} color={COLORS.accent} />
    },
    {
      title: 'Easy Integration',
      description: 'Simple API with comprehensive documentation',
      icon: <Code size={20} color={COLORS.secondary} />
    }
  ];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.title}>RevenueCat Integration</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.heroSection}
        >
          <Image
            source={{ uri: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=400&h=200' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Mobile Subscription Management Made Easy</Text>
            <Text style={styles.heroSubtitle}>
              RevenueCat handles billing, entitlements, and analytics for iOS and Android subscriptions
            </Text>
          </View>
        </LinearGradient>

        {/* Why RevenueCat Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why RevenueCat?</Text>
          <Text style={styles.sectionDescription}>
            Building subscription infrastructure is complex. RevenueCat provides everything you need out of the box.
          </Text>

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

        {/* Integration Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integration Steps</Text>
          <Text style={styles.sectionDescription}>
            Follow these steps to add RevenueCat to your exported project
          </Text>

          <View style={styles.stepsContainer}>
            {integrationSteps.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.stepCard,
                  activeStep === index && styles.activeStepCard
                ]}
                onPress={() => setActiveStep(activeStep === index ? -1 : index)}
              >
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepIcon}>
                    {step.icon}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>

                {activeStep === index && (
                  <View style={styles.stepDetails}>
                    {step.details.map((detail, detailIndex) => (
                      <View key={detailIndex} style={styles.stepDetail}>
                        <CheckCircle size={16} color={COLORS.success} />
                        <Text style={styles.stepDetailText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <View style={styles.warningCard}>
            <AlertCircle size={24} color={COLORS.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Important Notes</Text>
              <Text style={styles.warningText}>
                • RevenueCat requires native code and won't work in Bolt's browser preview{'\n'}
                • You'll need to create a development build using Expo Dev Client{'\n'}
                • Subscription testing requires real devices, not simulators{'\n'}
                • App Store / Google Play approval is required for live subscriptions
              </Text>
            </View>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Helpful Resources</Text>
          
          <View style={styles.resourcesContainer}>
            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => handleOpenLink('https://www.revenuecat.com/docs/getting-started/installation/expo')}
            >
              <View style={styles.resourceIcon}>
                <ExternalLink size={20} color={COLORS.primary} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>RevenueCat Expo Guide</Text>
                <Text style={styles.resourceDescription}>Official integration guide for Expo projects</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => handleOpenLink('https://docs.expo.dev/development/build/')}
            >
              <View style={styles.resourceIcon}>
                <ExternalLink size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>Expo Dev Client</Text>
                <Text style={styles.resourceDescription}>Create development builds for testing native features</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => handleOpenLink('https://www.revenuecat.com/docs/getting-started/entitlements')}
            >
              <View style={styles.resourceIcon}>
                <ExternalLink size={20} color={COLORS.accent} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>Entitlements Guide</Text>
                <Text style={styles.resourceDescription}>Learn how to configure subscription entitlements</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sample Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Integration Code</Text>
          
          <View style={styles.codeCard}>
            <Text style={styles.codeTitle}>Basic RevenueCat Setup</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
{`// Install: npx expo install react-native-purchases

import Purchases from 'react-native-purchases';

// Initialize RevenueCat
await Purchases.configure({
  apiKey: 'your_api_key_here',
});

// Check subscription status
const customerInfo = await Purchases.getCustomerInfo();
const isSubscribed = customerInfo.entitlements.active['premium'] !== undefined;

// Purchase subscription
const offerings = await Purchases.getOfferings();
const purchaseResult = await Purchases.purchasePackage(
  offerings.current.monthly
);`}
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.ctaCard}
          >
            <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
            <Text style={styles.ctaDescription}>
              Export your project and follow the integration guide to add subscription functionality
            </Text>
            
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => handleOpenLink('https://www.revenuecat.com/docs/getting-started/installation/expo')}
            >
              <ExternalLink size={20} color={COLORS.primary} />
              <Text style={styles.ctaButtonText}>View Integration Guide</Text>
            </TouchableOpacity>
          </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
    lineHeight: 16,
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  activeStepCard: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.white,
  },
  stepIcon: {
    marginRight: 12,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  stepDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  stepDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralLight,
  },
  stepDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginLeft: 8,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningContent: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  warningText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    lineHeight: 20,
  },
  resourcesContainer: {
    gap: 12,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutralExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  resourceDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  codeCard: {
    backgroundColor: COLORS.neutralExtraDark,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  codeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
  },
  codeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.white,
    lineHeight: 18,
  },
  ctaSection: {
    padding: 16,
    paddingBottom: 32,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
});