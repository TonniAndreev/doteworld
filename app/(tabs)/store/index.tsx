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
  Infinity,
  Bug
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { usePaws } from '@/contexts/PawsContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StoreScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [adCooldownTime, setAdCooldownTime] = useState(0);
  const [isTestingAd, setIsTestingAd] = useState(false);
  
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

  const handleTestAd = async () => {
    if (isTestingAd) return;
    
    setIsTestingAd(true);
    try {
      console.log('Running test ad...');
      const success = await watchAd();
      if (success) {
        Alert.alert('Success!', 'Test ad completed successfully! You earned 1 Paw! 🐾');
      } else {
        Alert.alert('Test Failed', 'The test ad failed to complete. Check console logs for details.');
      }
    } catch (error) {
      console.error('Test ad error:', error);
      Alert.alert('Test Error', `Error running test ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingAd(false);
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
        {/* Current Balance with Countdown */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <PawPrint size={24} color={COLORS.primary} />
              <Text style={styles.balanceText}>
                {isSubscribed ? '∞ Unlimited' : `${pawsBalance}/${maxPaws} Paws`}
              </Text>
              {!isSubscribed && (
                <View style={styles.countdownContainer}>
                  <Clock size={16} color={COLORS.neutralMedium} />
                  <Text style={styles.countdownText}>
                    {formatTimeUntil(timeUntilNextPaw)}
                  </Text>
                </View>
              )}
            </View>
            {isSubscribed && (
              <View style={styles.premiumBadge}>
                <Crown size={14} color={COLORS.accent} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
        </View>

        {/* Unlimited Paws - Light Design */}
        <View style={styles.unlimitedSection}>
          <View style={styles.unlimitedCard}>
            <View style={styles.unlimitedHeader}>
              <View style={styles.unlimitedIcon}>
                <Infinity size={32} color={COLORS.primary} />
              </View>
              <View style={styles.unlimitedInfo}>
                <Text style={styles.unlimitedTitle}>Unlimited Paws</Text>
                <Text style={styles.unlimitedPrice}>$5/month</Text>
              </View>
            </View>

            <Text style={styles.unlimitedDescription}>
              Make infinite conquests and never watch ads again
            </Text>

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

        {/* Watch Ads - Grayscale Design */}
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
                    ? `Wait ${formatTime(adCooldownTime)} before watching another ad, or wait for your daily free paw.`
                    : dailyAdsWatched >= maxDailyAds
                    ? `You've reached today's ad limit. Your next free paw arrives soon.`
                    : `Your paws are full! Your next free paw arrives soon.`
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
            </View>
          </View>
        )}

        {/* Developer Tools Section - Only visible in development */}
        {__DEV__ && (
          <View style={styles.devToolsSection}>
            <View style={styles.devToolsCard}>
              <View style={styles.devToolsHeader}>
                <Bug size={24} color={COLORS.neutralDark} />
                <Text style={styles.devToolsTitle}>Developer Tools</Text>
              </View>
              
              <Text style={styles.devToolsDescription}>
                These tools are only visible in development mode and will not appear in production builds.
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.devToolsButton,
                  isTestingAd && styles.devToolsButtonDisabled
                ]}
                onPress={handleTestAd}
                disabled={isTestingAd}
              >
                {isTestingAd ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Play size={18} color={COLORS.white} />
                    <Text style={styles.devToolsButtonText}>
                      Run Test Ad
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
  
  // Balance Section with Countdown
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
    flex: 1,
  },
  balanceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginLeft: 12,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  countdownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginLeft: 4,
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

  // Unlimited Paws Section - Light Design
  unlimitedSection: {
    padding: 16,
    paddingTop: 8,
  },
  unlimitedCard: {
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  unlimitedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  unlimitedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unlimitedInfo: {
    flex: 1,
  },
  unlimitedTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  unlimitedPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralMedium,
  },
  unlimitedDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    lineHeight: 22,
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

  // Ads Section - Grayscale Design
  adsSection: {
    padding: 16,
    paddingTop: 8,
  },
  adsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  adsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280', // Grayscale header
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
    backgroundColor: '#F3F4F6', // Light grayscale
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
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
    backgroundColor: '#4B5563', // Dark grayscale
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  watchAdButtonDisabled: {
    backgroundColor: '#9CA3AF', // Lighter grayscale for disabled
    shadowOpacity: 0,
    elevation: 0,
  },
  watchAdButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },

  // Developer Tools Section
  devToolsSection: {
    padding: 16,
    paddingTop: 8,
  },
  devToolsCard: {
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.neutralLight,
    borderStyle: 'dashed',
  },
  devToolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  devToolsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  devToolsDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 16,
  },
  devToolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  devToolsButtonDisabled: {
    opacity: 0.6,
  },
  devToolsButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
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