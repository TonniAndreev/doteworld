import { Platform } from 'react-native';

interface AdMobConfig {
  appId: string;
  rewardedAdUnitId: string;
  testDeviceIds?: string[];
}

interface AdReward {
  type: string;
  amount: number;
}

class AdMobService {
  private isInitialized = false;
  private isAdLoaded = false;
  private config: AdMobConfig | null = null;
  private rewardedAd: any = null;

  async initialize(config: AdMobConfig): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('AdMob: Mock initialization for web platform');
      this.isInitialized = true;
      this.config = config;
      return;
    }

    try {
      // Import the library dynamically to avoid issues on web
      const { GoogleMobileAds, TestIds } = require('react-native-google-mobile-ads');
      
      console.log('AdMob: Initializing with config:', config);
      
      // Initialize Google Mobile Ads
      await GoogleMobileAds().initialize();
      
      // Set test device IDs if provided
      if (config.testDeviceIds && config.testDeviceIds.length > 0) {
        await GoogleMobileAds().setRequestConfiguration({
          testDeviceIdentifiers: config.testDeviceIds,
        });
      }
      
      this.isInitialized = true;
      this.config = config;
      
      console.log('AdMob: Initialization successful');
    } catch (error) {
      console.error('AdMob initialization error:', error);
      throw new Error('Failed to initialize AdMob');
    }
  }

  async loadRewardedAd(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AdMob not initialized');
    }

    if (Platform.OS === 'web') {
      console.log('AdMob: Mock load rewarded ad for web platform');
      this.isAdLoaded = true;
      return;
    }

    try {
      const { RewardedAd, RewardedAdEventType, TestIds } = require('react-native-google-mobile-ads');
      
      // Use test ad unit ID in development
      const adUnitId = __DEV__ ? TestIds.REWARDED : this.config!.rewardedAdUnitId;
      
      console.log('AdMob: Loading rewarded ad with unit ID:', adUnitId);
      
      // Create rewarded ad instance
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      // Set up event listeners
      const unsubscribeLoaded = this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('AdMob: Rewarded ad loaded successfully');
        this.isAdLoaded = true;
        unsubscribeLoaded();
      });

      const unsubscribeFailedToLoad = this.rewardedAd.addAdEventListener(RewardedAdEventType.ERROR, (error: any) => {
        console.error('AdMob: Failed to load rewarded ad:', error);
        this.isAdLoaded = false;
        unsubscribeFailedToLoad();
      });

      // Load the ad
      this.rewardedAd.load();
      
      // Wait for ad to load or fail (with timeout)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Ad loading timeout'));
        }, 10000); // 10 second timeout

        const checkLoaded = () => {
          if (this.isAdLoaded) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        
        checkLoaded();
      });
      
    } catch (error) {
      console.error('AdMob load ad error:', error);
      this.isAdLoaded = false;
      throw new Error('Failed to load rewarded ad');
    }
  }

  async showRewardedAd(): Promise<AdReward> {
    if (!this.isInitialized) {
      throw new Error('AdMob not initialized');
    }

    if (!this.isAdLoaded) {
      throw new Error('No ad loaded');
    }

    if (Platform.OS === 'web') {
      console.log('AdMob: Mock show rewarded ad for web platform');
      // Simulate ad completion
      await new Promise(resolve => setTimeout(resolve, 3000));
      this.isAdLoaded = false;
      return { type: 'paws', amount: 1 };
    }

    try {
      const { RewardedAdEventType } = require('react-native-google-mobile-ads');
      
      console.log('AdMob: Showing rewarded ad');
      
      return new Promise<AdReward>((resolve, reject) => {
        let rewardEarned = false;
        
        // Set up reward listener
        const unsubscribeEarnedReward = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          (reward: any) => {
            console.log('AdMob: User earned reward:', reward);
            rewardEarned = true;
            unsubscribeEarnedReward();
          }
        );

        // Set up ad closed listener
        const unsubscribeClosed = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.CLOSED,
          () => {
            console.log('AdMob: Rewarded ad closed');
            this.isAdLoaded = false;
            this.rewardedAd = null;
            unsubscribeClosed();
            
            if (rewardEarned) {
              resolve({ type: 'paws', amount: 1 });
            } else {
              reject(new Error('Ad was closed without earning reward'));
            }
          }
        );

        // Set up error listener
        const unsubscribeError = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.ERROR,
          (error: any) => {
            console.error('AdMob: Error showing rewarded ad:', error);
            this.isAdLoaded = false;
            this.rewardedAd = null;
            unsubscribeError();
            unsubscribeClosed();
            unsubscribeEarnedReward();
            reject(new Error('Failed to show rewarded ad'));
          }
        );

        // Show the ad
        this.rewardedAd.show();
      });
      
    } catch (error) {
      console.error('AdMob show ad error:', error);
      this.isAdLoaded = false;
      this.rewardedAd = null;
      throw new Error('Failed to show rewarded ad');
    }
  }

  isAdReady(): boolean {
    return this.isAdLoaded;
  }

  getTestDeviceIds(): string[] {
    return this.config?.testDeviceIds || [];
  }
}

export const adMobService = new AdMobService();

// Configuration constants with real production IDs
export const ADMOB_CONFIG: AdMobConfig = {
  appId: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-2380886531830921~9974124526', // Real iOS app ID
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-2380886531830921~8661042855', // Real Android app ID
    default: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-2380886531830921~8661042855'
  }),
  rewardedAdUnitId: Platform.select({
    ios: 'ca-app-pub-2380886531830921/5954988462', // Real iOS rewarded ad unit ID
    android: 'ca-app-pub-2380886531830921/9866313310', // Real Android rewarded ad unit ID
    default: 'ca-app-pub-2380886531830921/9866313310'
  }),
  testDeviceIds: [
    // Add your test device IDs here for development testing
    // This ensures you see test ads during development
    // You can find your device ID in the console logs when running the app
    '2077ef9a63d2b398840261c8221a0c9b', // Example device ID - replace with your actual device ID
    // Add more test device IDs if needed
  ]
};

export type { AdMobConfig, AdReward };