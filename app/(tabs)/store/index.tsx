import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ChevronLeft, 
  Crown, 
  PawPrint, 
  Play, 
  Clock, 
  Check, 
  Star,
  Zap,
  Shield,
  Gift,
  History,
  RefreshCw
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { usePaws } from '@/contexts/PawsContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  color: string;
  icon: React.ReactNode;
}

export default function StoreScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [adCooldownTime, setAdCooldownTime] = useState(0);
  
  const { 
    pawsBalance, 
    maxPaws, 
    dailyAdsWatched, 
    maxDailyAds, 
    isSubscribed,
    transactions,
    timeUntilNextPaw,
    watchAd,
    setSubscriptionStatus
  } = usePaws();

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: 'basic',
      name: 'Paws Basic',
      price: '$2.99',
      period: 'month',
      features: [
        'Unlimited territory conquests',
        'No ads between walks',
        'Priority customer support',
        'Basic achievement badges'
      ],
      color: COLORS.primary,
      icon: <PawPrint size={24} color={COLORS.white} />
    },
    {
      id: 'premium',
      name: 'Paws Premium',
      price: '$4.99',
      period: 'month',
      popular: true,
      features: [
        'Everything in Basic',
        'Exclusive premium badges',
        'Advanced territory analytics',
        'Custom dog profile themes',
        'Early access to new features'
      ],
      color: COLORS.accent,
      icon: <Crown size={24} color={COLORS.white} />
    },
    {
      id: 'family',
      name: 'Paws Family',
      price: '$7.99',
      period: 'month',
      features: [
        'Everything in Premium',
        'Up to 5 dog profiles',
        'Family leaderboards',
        'Shared territory maps',
        'Group challenges'
      ],
      color: COLORS.secondary,
      icon: <Shield size={24} color={COLORS.white} />
    }
  ];

  // Countdown timer for ad cooldown
  useEffect(() => {
    if (adCooldownTime > 0) {
      const timer = setTimeout(() => {
        setAdCooldownTime(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [adCooldownTime]);

  const handleWatchAd = async () => {
    if (dailyAdsWatched >= maxDailyAds || pawsBalance >= maxPaws) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await watchAd();
      if (success) {
        Alert.alert('Success!', 'You earned 1 Paw! 🐾');
        setAdCooldownTime(300); // 5 minute cooldown
      } else {
        Alert.alert('Error', 'Failed to load ad. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    setSelectedTier(tierId);
    setIsLoading(true);

    try {
      // TODO: Integrate with RevenueCat
      // For now, simulate subscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'RevenueCat Integration Required',
        'To complete this purchase, you\'ll need to:\n\n1. Export this project to your local environment\n2. Install RevenueCat SDK\n3. Configure your subscription products\n\nRevenueCat handles all billing, entitlements, and receipt validation for mobile subscriptions.',
        [
          { text: 'Learn More', onPress: () => router.push('/(tabs)/store/package') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedTier(null);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeUntil = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const canWatchAd = dailyAdsWatched < maxDailyAds && pawsBalance < maxPaws && adCooldownTime === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Paws Store</Text>
        
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => setShowTransactionHistory(!showTransactionHistory)}
        >
          <History size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance Section */}
        <View style={styles.balanceSection}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <PawPrint size={32} color={COLORS.white} />
              <Text style={styles.balanceTitle}>Current Balance</Text>
            </View>
            
            <View style={styles.balanceContent}>
              <Text style={styles.balanceAmount}>
                {isSubscribed ? '∞' : `${pawsBalance}/${maxPaws}`}
              </Text>
              <Text style={styles.balanceSubtitle}>
                {isSubscribed ? 'Unlimited Paws' : 'Paws Available'}
              </Text>
            </View>

            {isSubscribed && (
              <View style={styles.subscriptionBadge}>
                <Crown size={16} color={COLORS.accent} />
                <Text style={styles.subscriptionText}>Premium Active</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Free Paws Section */}
        {!isSubscribed && (
          <View style={styles.freePawsSection}>
            <Text style={styles.sectionTitle}>Earn Free Paws</Text>
            
            <View style={styles.adCard}>
              <View style={styles.adHeader}>
                <Play size={24} color={COLORS.primary} />
                <View style={styles.adInfo}>
                  <Text style={styles.adTitle}>Watch Ad for Paws</Text>
                  <Text style={styles.adSubtitle}>
                    Earn 1 Paw per ad • {dailyAdsWatched}/{maxDailyAds} watched today
                  </Text>
                </View>
              </View>

              {adCooldownTime > 0 ? (
                <View style={styles.cooldownContainer}>
                  <Clock size={16} color={COLORS.neutralMedium} />
                  <Text style={styles.cooldownText}>
                    Next ad in {formatTime(adCooldownTime)}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.adButton,
                    !canWatchAd && styles.adButtonDisabled
                  ]}
                  onPress={handleWatchAd}
                  disabled={!canWatchAd || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Play size={20} color={COLORS.white} />
                      <Text style={styles.adButtonText}>
                        {canWatchAd ? 'Watch Ad' : 'Daily Limit Reached'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dailyPawCard}>
              <Gift size={24} color={COLORS.secondary} />
              <View style={styles.dailyPawInfo}>
                <Text style={styles.dailyPawTitle}>Daily Free Paw</Text>
                <Text style={styles.dailyPawSubtitle}>
                  Next free paw in {formatTimeUntil(timeUntilNextPaw)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Subscription Tiers */}
        <View style={styles.subscriptionSection}>
          <Text style={styles.sectionTitle}>Subscription Plans</Text>
          <Text style={styles.sectionSubtitle}>
            Unlock unlimited paws and premium features
          </Text>

          {subscriptionTiers.map((tier, index) => (
            <View key={tier.id} style={styles.tierCard}>
              {tier.popular && (
                <View style={styles.popularBadge}>
                  <Star size={12} color={COLORS.white} />
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}

              <LinearGradient
                colors={[tier.color, `${tier.color}CC`]}
                style={styles.tierHeader}
              >
                <View style={styles.tierIcon}>
                  {tier.icon}
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <View style={styles.tierPricing}>
                    <Text style={styles.tierPrice}>{tier.price}</Text>
                    <Text style={styles.tierPeriod}>/{tier.period}</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={styles.tierFeatures}>
                {tier.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <Check size={16} color={COLORS.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  { backgroundColor: tier.color },
                  selectedTier === tier.id && styles.subscribeButtonLoading
                ]}
                onPress={() => handleSubscribe(tier.id)}
                disabled={isLoading}
              >
                {selectedTier === tier.id && isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Zap size={20} color={COLORS.white} />
                    <Text style={styles.subscribeButtonText}>
                      {isSubscribed ? 'Current Plan' : 'Subscribe'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Transaction History */}
        {showTransactionHistory && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <History size={48} color={COLORS.neutralMedium} />
                <Text style={styles.emptyHistoryText}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 10).map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      {transaction.type === 'credit' ? (
                        <PawPrint size={16} color={COLORS.success} />
                      ) : (
                        <PawPrint size={16} color={COLORS.error} />
                      )}
                    </View>
                    
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <Text style={[
                      styles.transactionAmount,
                      transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount
                    ]}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Subscriptions auto-renew unless cancelled. Cancel anytime in your account settings.
          </Text>
          
          <TouchableOpacity 
            style={styles.learnMoreButton}
            onPress={() => router.push('/(tabs)/store/package')}
          >
            <Text style={styles.learnMoreText}>Learn about RevenueCat Integration</Text>
          </TouchableOpacity>
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
  historyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  balanceSection: {
    padding: 16,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.white,
    marginLeft: 12,
  },
  balanceContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: COLORS.white,
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  subscriptionText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 6,
  },
  freePawsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 16,
  },
  adCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  adInfo: {
    marginLeft: 12,
    flex: 1,
  },
  adTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  adSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
  },
  cooldownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginLeft: 6,
  },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  adButtonDisabled: {
    backgroundColor: COLORS.neutralMedium,
  },
  adButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  dailyPawCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    padding: 16,
    borderRadius: 12,
  },
  dailyPawInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dailyPawTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  dailyPawSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  subscriptionSection: {
    padding: 16,
  },
  tierCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: COLORS.white,
    marginLeft: 4,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 4,
  },
  tierPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.white,
  },
  tierPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tierFeatures: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginLeft: 12,
    flex: 1,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    margin: 20,
    borderRadius: 12,
  },
  subscribeButtonLoading: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  historySection: {
    padding: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  transactionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  transactionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  transactionAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  creditAmount: {
    color: COLORS.success,
  },
  debitAmount: {
    color: COLORS.error,
  },
  footerInfo: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  learnMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  learnMoreText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
});