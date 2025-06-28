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
import { LinearGradient } from 'expo-linear-gradient';
import { usePaws } from '@/contexts/PawsContext';

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
        {/* Current Balance - Compact */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <PawPrint size={24} color={COLORS.primary} />
              <Text style={styles.balanceText}>
                {isSubscribed ? '∞ Unlimited' : `${pawsBalance}/${maxPaws} Paws`}
              </Text>
            </View>
            {isSubscribed && (
              <View style={styles.premiumBadge}>
                <Crown size={14} color={COLORS.accent} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
        </View>

        {/* Unlimited Paws with Price - Primary */}
        <View style={styles.unlimitedSection}>
          <View style={styles.unlimitedCard}>
            <View style={styles.unlimitedHeader}>
              <View style={styles.unlimitedIcon}>
                <Infinity size={32} color={COLORS.white} />
              </View>
              <View style={styles.unlimitedInfo}>
                <Text style={styles.unlimitedTitle}>Unlimited Paws</Text>
                <Text style={styles.unlimitedPrice}>$5/month</Text>
              </View>
            </View>

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
                    {isSubscribed ? 'Currently Subscribed' : 'Subscribe Now'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.guaranteeSection}>
              <Shield size={14} color={COLORS.success} />
              <Text style={styles.guaranteeText}>
                Cancel anytime • 7-day money back guarantee
              </Text>
            </View>
          </View>
        </View>

        {/* Watch Ads - Prominent */}
        {!isSubscribed && (
          <View style={styles.adsSection}>
            <View style={styles.adsCard}>
              <View style={styles.adsHeader}>
                <View style={styles.adsIcon}>
                  <Play size={28} color={COLORS.white} />
                </View>
                <View style={styles.adsInfo}>
                  <Text style={styles.adsTitle}>Watch Ads for Free Paws</Text>
                  <Text style={styles.adsSubtitle}>
                    Earn 1 Paw per ad • {dailyAdsWatched}/{maxDailyAds} watched today
                  </Text>
                </View>
              </View>

              <View style={styles.adsExplanation}>
                <Text style={styles.explanationText}>
                  {canWatchAd 
                    ? "Watch a short ad to earn a free paw instantly, or wait for your daily free paw."
                    : adCooldownTime > 0
                    ? `Wait ${formatTime(adCooldownTime)} before watching another ad, or wait for your daily free paw in ${formatTimeUntil(timeUntilNextPaw)}.`
                    : dailyAdsWatched >= maxDailyAds
                    ? `You've reached today's ad limit. Your next free paw arrives in ${formatTimeUntil(timeUntilNextPaw)}.`
                    : `Your paws are full! Your next free paw arrives in ${formatTimeUntil(timeUntilNextPaw)}.`
                  }
                </Text>
              </View>

              {adCooldownTime > 0 ? (
                <View style={styles.cooldownContainer}>
                  <Clock size={18} color={COLORS.neutralMedium} />
                  <Text style={styles.cooldownText}>
                    Next ad in {formatTime(adCooldownTime)}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.watchAdButton,
                    !canWatchAd && styles.watchAdButtonDisabled
                  ]}
                  onPress={handleWatchAd}
                  disabled={!canWatchAd || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Play size={18} color={COLORS.white} />
                      <Text style={styles.watchAdButtonText}>
                        {canWatchAd ? 'Watch Ad (+1 Paw)' : 'Limit Reached'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Next Free Paw Timer */}
              <View style={styles.nextPawContainer}>
                <Gift size={16} color={COLORS.secondary} />
                <Text style={styles.nextPawText}>
                  Next free paw in {formatTimeUntil(timeUntilNextPaw)}
                </Text>
              </View>
            </View>
          </View>
        )}

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
  
  // Balance Section - Compact
  balanceSection: {
    padding: 16,
    paddingBottom: 8,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.neutralExtraLight,
    padding: 16,
    borderRadius: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginLeft: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.accent,
    marginLeft: 4,
  },

  // Unlimited Paws Section - Primary
  unlimitedSection: {
    padding: 16,
    paddingTop: 8,
  },
  unlimitedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  unlimitedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 24,
  },
  unlimitedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  unlimitedInfo: {
    flex: 1,
  },
  unlimitedTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 4,
  },
  unlimitedPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
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

  // Ads Section - Prominent
  adsSection: {
    padding: 16,
    paddingTop: 8,
  },
  adsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  adsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    padding: 20,
  },
  adsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adsInfo: {
    flex: 1,
  },
  adsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 4,
  },
  adsSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  adsExplanation: {
    padding: 20,
    paddingBottom: 16,
  },
  explanationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: COLORS.neutralDark,
    lineHeight: 22,
    textAlign: 'center',
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.neutralLight,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  cooldownText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginLeft: 8,
  },
  watchAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  watchAdButtonDisabled: {
    backgroundColor: COLORS.neutralMedium,
    shadowOpacity: 0,
    elevation: 0,
  },
  watchAdButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  nextPawContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  nextPawText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginLeft: 6,
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