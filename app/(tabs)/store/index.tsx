import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Crown, PawPrint, Check, Zap } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { usePaws } from '@/contexts/PawsContext';

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 4.99,
    period: 'month',
    description: 'Perfect for regular walkers',
    features: [
      'Unlimited Paws',
      'No conquest restrictions',
      'Priority support',
      'Exclusive premium badges'
    ],
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: 39.99,
    period: 'year',
    description: 'Best value - Save 33%!',
    features: [
      'Unlimited Paws',
      'No conquest restrictions',
      'Priority support',
      'Exclusive premium badges',
      'Early access to new features',
      'Premium territory themes'
    ],
    popular: true,
    savings: 'Save $20/year',
  },
];

export default function StoreScreen() {
  const { 
    pawsBalance, 
    maxPaws, 
    dailyAdsWatched, 
    maxDailyAds, 
    isSubscribed, 
    setSubscriptionStatus,
    timeUntilNextPaw 
  } = usePaws();

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSubscribe = (planId: string) => {
    // TODO: Implement RevenueCat subscription logic
    console.log('Subscribing to plan:', planId);
    
    // For demo purposes, toggle subscription status
    setSubscriptionStatus(!isSubscribed);
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
        <Text style={styles.title}>Premium</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              {isSubscribed ? (
                <Crown size={32} color={COLORS.primary} />
              ) : (
                <PawPrint size={32} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isSubscribed ? 'Premium Active' : 'Free Plan'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isSubscribed 
                  ? 'Unlimited conquests available'
                  : `${pawsBalance}/${maxPaws} Paws remaining`
                }
              </Text>
            </View>
          </View>

          {!isSubscribed && (
            <View style={styles.freeStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Ads Watched Today</Text>
                <Text style={styles.statValue}>{dailyAdsWatched}/{maxDailyAds}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Next Free Paw</Text>
                <Text style={styles.statValue}>{formatTime(timeUntilNextPaw)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Demo Toggle (Remove in production) */}
        <View style={styles.demoCard}>
          <View style={styles.demoContent}>
            <Text style={styles.demoTitle}>Demo Mode</Text>
            <Text style={styles.demoDescription}>
              Toggle subscription status for testing
            </Text>
          </View>
          <Switch
            value={isSubscribed}
            onValueChange={setSubscriptionStatus}
            trackColor={{ false: COLORS.neutralLight, true: COLORS.primaryLight }}
            thumbColor={isSubscribed ? COLORS.primary : COLORS.neutralMedium}
          />
        </View>

        {/* Subscription Plans */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        
        {SUBSCRIPTION_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, plan.popular && styles.popularCard]}
            onPress={() => handleSubscribe(plan.id)}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Zap size={16} color={COLORS.white} />
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                {plan.savings && (
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>
            </View>
            
            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Check size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.subscribeButton}>
              <Crown size={20} color={COLORS.white} />
              <Text style={styles.subscribeButtonText}>
                {isSubscribed ? 'Current Plan' : 'Subscribe Now'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Go Premium?</Text>
          
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <PawPrint size={24} color={COLORS.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Unlimited Paws</Text>
              <Text style={styles.benefitDescription}>
                Never wait for paws to recharge. Start conquests anytime!
              </Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Zap size={24} color={COLORS.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>No Restrictions</Text>
              <Text style={styles.benefitDescription}>
                Explore and conquer territories without any limitations.
              </Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Crown size={24} color={COLORS.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Exclusive Features</Text>
              <Text style={styles.benefitDescription}>
                Access premium badges, themes, and early feature previews.
              </Text>
            </View>
          </View>
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
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
  freeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  demoCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoContent: {
    flex: 1,
  },
  demoTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 2,
  },
  demoDescription: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  popularCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 12,
    color: COLORS.white,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  planDescription: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  savingsText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 14,
    color: COLORS.success,
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 32,
    color: COLORS.neutralDark,
  },
  period: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
  featuresList: {
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  subscribeButtonText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  benefitsSection: {
    marginTop: 32,
  },
  benefitsTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 16,
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
  benefitIcon: {
    marginRight: 12,
  },
  benefitContent: {
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
});