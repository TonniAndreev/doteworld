import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  Infinity
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { usePaws } from '@/contexts/PawsContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StoreScreen() {
  const [isLoading, setIsLoading] = useState(false);
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

  const premiumFeatures = [
    'Unlimited territory conquests',
    'No ads between walks',
    'Exclusive premium badges',
    'Advanced territory analytics',
    'Custom dog profile themes',
    'Priority customer support'
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

  const handleSubscribe = async () => {
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
        contentContainerStyle={styles.scrollContent}
      >
        {/* Premium Subscription Section - Primary Focus */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumCard}>
            {/* Popular Badge */}
            <View style={styles.popularBadge}>
              <Star size={12} color={COLORS.white} />
              <Text style={styles.popularText}>Most Popular</Text>
            </View>

            {/* Premium Header */}
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.premiumHeader}
            >
              <View style={styles.premiumIcon}>
                <Crown size={40} color={COLORS.white} />
              </View>
              <Text style={styles.premiumName}>Paws Premium</Text>
              <View style={styles.premiumPricing}>
                <Text style={styles.premiumPrice}>$5.00</Text>
                <Text style={styles.premiumPeriod}>/month</Text>
              </View>
              <Text style={styles.premiumDescription}>
                Unlimited paws & exclusive features
              </Text>
            </LinearGradient>

            {/* Unlimited Paws Highlight */}
            <View style={styles.unlimitedSection}>
              <View style={styles.unlimitedCard}>
                <Infinity size={32} color={COLORS.primary} />
                <View style={styles.unlimitedInfo}>
                  <Text style={styles.unlimitedTitle}>Unlimited Paws</Text>
                  <Text style={styles.unlimitedSubtitle}>
                    Never run out of conquests
                  </Text>
                </View>
              </View>
            </View>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <View style={styles.featuresGrid}>
                {premiumFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={16} color={COLORS.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                isLoading && styles.subscribeButtonLoading
              ]}
              onPress={handleSubscribe}
              disabled={isLoading || isSubscribed}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Zap size={20} color={COLORS.white} />
                  <Text style={styles.subscribeButtonText}>
                    {isSubscribed ? 'Currently Subscribed' : 'Start Premium'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Money Back Guarantee */}
            <View style={styles.guaranteeSection}>
              <Shield size={16} color={COLORS.success} />
              <Text style={styles.guaranteeText}>
                7-day money back guarantee • Cancel anytime
              </Text>
            </View>
          </View>
        </View>

        {/* Current Balance & Free Options */}
        <View style={styles.freeOptionsSection}>
          {/* Compact Balance Display */}
          <View style={styles.compactBalanceCard}>
            <View style={styles.balanceRow}>
              <PawPrint size={20} color={COLORS.primary} />
              <Text style={styles.compactBalanceText}>
                {isSubscribed ? '∞ Unlimited' : `${pawsBalance}/${maxPaws} Paws`}
              </Text>
            </View>
            {isSubscribed && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color={COLORS.accent} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>

          {/* Free Paws Options */}
          {!isSubscribed && (
            <View style={styles.freeOptionsGrid}>
              {/* Watch Ad Card */}
              <View style={styles.freeOptionCard}>
                <View style={styles.freeOptionHeader}>
                  <Play size={20} color={COLORS.primary} />
                  <Text style={styles.freeOptionTitle}>Watch Ad</Text>
                </View>
                <Text style={styles.freeOptionSubtitle}>
                  Earn 1 Paw • {dailyAdsWatched}/{maxDailyAds} today
                </Text>
                
                {adCooldownTime > 0 ? (
                  <View style={styles.cooldownContainer}>
                    <Clock size={14} color={COLORS.neutralMedium} />
                    <Text style={styles.cooldownText}>
                      {formatTime(adCooldownTime)}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.freeOptionButton,
                      !canWatchAd && styles.freeOptionButtonDisabled
                    ]}
                    onPress={handleWatchAd}
                    disabled={!canWatchAd || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.freeOptionButtonText}>
                        {canWatchAd ? 'Watch' : 'Limit Reached'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Daily Free Paw Card */}
              <View style={styles.freeOptionCard}>
                <View style={styles.freeOptionHeader}>
                  <Gift size={20} color={COLORS.secondary} />
                  <Text style={styles.freeOptionTitle}>Daily Free</Text>
                </View>
                <Text style={styles.freeOptionSubtitle}>
                  Next in {formatTimeUntil(timeUntilNextPaw)}
                </Text>
                <View style={styles.freeOptionButton}>
                  <Text style={styles.freeOptionButtonText}>Tomorrow</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Transaction History */}
        {showTransactionHistory && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <History size={32} color={COLORS.neutralMedium} />
                <Text style={styles.emptyHistoryText}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 5).map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <PawPrint size={12} color={
                        transaction.type === 'credit' ? COLORS.success : COLORS.error
                      } />
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
  scrollContent: {
    flexGrow: 1,
  },
  
  // Premium Section - Primary Focus
  premiumSection: {
    padding: 16,
    paddingBottom: 8,
  },
  premiumCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    zIndex: 1,
  },
  popularText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 4,
  },
  premiumHeader: {
    padding: 32,
    alignItems: 'center',
  },
  premiumIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumName: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.white,
    marginBottom: 8,
  },
  premiumPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  premiumPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: COLORS.white,
  },
  premiumPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  premiumDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  unlimitedSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  unlimitedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 16,
  },
  unlimitedInfo: {
    marginLeft: 16,
    flex: 1,
  },
  unlimitedTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 4,
  },
  unlimitedSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: COLORS.neutralDark,
    marginLeft: 12,
    flex: 1,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    margin: 20,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonLoading: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.white,
    marginLeft: 8,
  },
  guaranteeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  guaranteeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginLeft: 6,
  },

  // Free Options Section - Secondary
  freeOptionsSection: {
    padding: 16,
    paddingTop: 8,
  },
  compactBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.neutralExtraLight,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBalanceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.accent,
    marginLeft: 4,
  },
  freeOptionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  freeOptionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  freeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeOptionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  freeOptionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginBottom: 12,
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 8,
  },
  cooldownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginLeft: 4,
  },
  freeOptionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  freeOptionButtonDisabled: {
    backgroundColor: COLORS.neutralMedium,
  },
  freeOptionButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.white,
  },

  // History Section
  historySection: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyHistoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginTop: 8,
  },
  transactionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  transactionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: 13,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  transactionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: COLORS.neutralMedium,
  },
  transactionAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  creditAmount: {
    color: COLORS.success,
  },
  debitAmount: {
    color: COLORS.error,
  },

  // Footer
  footerInfo: {
    padding: 16,
    alignItems: 'center',
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