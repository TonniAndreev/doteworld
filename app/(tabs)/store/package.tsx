import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, PawPrint, Shield, Clock, Award } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

const PAWS_PACKAGES = {
  basic: {
    id: 'basic',
    name: 'Basic Pack',
    amount: 500,
    price: 4.99,
    description: 'Perfect for casual walkers who want to enhance their walking experience.',
    features: ['500 Paws', 'Valid for 30 days', 'Basic rewards'],
    benefits: [
      {
        icon: <PawPrint size={24} color={COLORS.primary} />,
        title: 'Instant Delivery',
        description: 'Get your Paws immediately after purchase',
      },
      {
        icon: <Shield size={24} color={COLORS.primary} />,
        title: 'Secure Transaction',
        description: 'Your payment is protected and secure',
      },
      {
        icon: <Clock size={24} color={COLORS.primary} />,
        title: '30-Day Validity',
        description: 'Use your Paws within 30 days of purchase',
      },
      {
        icon: <Award size={24} color={COLORS.primary} />,
        title: 'Basic Rewards',
        description: 'Access to basic reward tiers and badges',
      },
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Pack',
    amount: 1500,
    price: 9.99,
    description: 'The perfect choice for regular walkers looking to maximize their rewards.',
    features: ['1500 Paws', 'Valid for 30 days', '10% bonus on earned Paws', 'Premium rewards'],
    benefits: [
      {
        icon: <PawPrint size={24} color={COLORS.primary} />,
        title: 'More Paws',
        description: '1500 Paws with 10% bonus on earnings',
      },
      {
        icon: <Shield size={24} color={COLORS.primary} />,
        title: 'Premium Benefits',
        description: 'Access exclusive premium features',
      },
      {
        icon: <Clock size={24} color={COLORS.primary} />,
        title: 'Extended Usage',
        description: 'Flexible 30-day usage period',
      },
      {
        icon: <Award size={24} color={COLORS.primary} />,
        title: 'Premium Rewards',
        description: 'Unlock premium badges and rewards',
      },
    ],
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate Pack',
    amount: 5000,
    price: 24.99,
    description: 'The ultimate package for dedicated walkers seeking the best value and rewards.',
    features: ['5000 Paws', 'Valid for 30 days', '25% bonus on earned Paws', 'Premium rewards', 'Exclusive badges'],
    benefits: [
      {
        icon: <PawPrint size={24} color={COLORS.primary} />,
        title: 'Maximum Paws',
        description: '5000 Paws with 25% bonus on earnings',
      },
      {
        icon: <Shield size={24} color={COLORS.primary} />,
        title: 'Ultimate Protection',
        description: 'Full coverage and premium support',
      },
      {
        icon: <Clock size={24} color={COLORS.primary} />,
        title: 'Priority Access',
        description: 'Early access to new features',
      },
      {
        icon: <Award size={24} color={COLORS.primary} />,
        title: 'Exclusive Rewards',
        description: 'Access to exclusive ultimate tier rewards',
      },
    ],
  },
};

export default function PackageScreen() {
  const { id } = useLocalSearchParams();
  const pack = PAWS_PACKAGES[id as keyof typeof PAWS_PACKAGES];

  if (!pack) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        <Text style={styles.title}>{pack.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.priceSection}>
          <View style={styles.pawsContainer}>
            <PawPrint size={32} color={COLORS.primary} />
            <Text style={styles.pawsAmount}>{pack.amount} Paws</Text>
          </View>
          <Text style={styles.price}>${pack.price}</Text>
          <Text style={styles.description}>{pack.description}</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Package Features</Text>
          {pack.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          {pack.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitCard}>
              {benefit.icon}
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <TouchableOpacity 
          style={styles.purchaseButton}
          onPress={() => {
            // Stripe integration will be added here
            alert('Stripe integration coming soon!');
          }}
        >
          <Text style={styles.purchaseButtonText}>Purchase Now</Text>
          <Text style={styles.purchaseButtonPrice}>${pack.price}</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pawsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pawsAmount: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 32,
    color: COLORS.primary,
    marginLeft: 8,
  },
  price: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 48,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  featureText: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitContent: {
    marginLeft: 12,
    flex: 1,
  },
  benefitTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  benefitDescription: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralLight,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  purchaseButtonText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 18,
    color: COLORS.white,
  },
  purchaseButtonPrice: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 18,
    color: COLORS.white,
  },
});