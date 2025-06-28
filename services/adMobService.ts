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

  async initialize(config: AdMobConfig): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('AdMob: Mock initialization for web platform');
      this.isInitialized = true;
      this.config = config;
      return;
    }

    try {
      // TODO: Replace with actual AdMob initialization
      // const { GoogleMobileAds } = require('react-native-google-mobile-ads');
      // await GoogleMobileAds().initialize();
      
      console.log('AdMob: Would initialize with config:', config);
      this.isInitialized = true;
      this.config = config;
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
      // TODO: Replace with actual AdMob rewarded ad loading
      // const { RewardedAd, RewardedAdEventType } = require('react-native-google-mobile-ads');
      // const rewardedAd = RewardedAd.createForAdRequest(this.config!.rewardedAdUnitId);
      // await rewardedAd.load();
      
      console.log('AdMob: Would load rewarded ad');
      this.isAdLoaded = true;
    } catch (error) {
      console.error('AdMob load ad error:', error);
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
      // TODO: Replace with actual AdMob rewarded ad showing
      // const reward = await this.rewardedAd.show();
      
      console.log('AdMob: Would show rewarded ad');
      this.isAdLoaded = false;
      
      // Mock reward
      return { type: 'paws', amount: 1 };
    } catch (error) {
      console.error('AdMob show ad error:', error);
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

// Configuration constants
export const ADMOB_CONFIG: AdMobConfig = {
  appId: Platform.select({
    ios: 'ca-app-pub-3940256099942544~1458002511', // Test app ID
    android: 'ca-app-pub-3940256099942544~3347511713', // Test app ID
    default: 'test-app-id'
  }),
  rewardedAdUnitId: Platform.select({
    ios: 'ca-app-pub-3940256099942544/1712485313', // Test rewarded ad unit ID
    android: 'ca-app-pub-3940256099942544/5224354917', // Test rewarded ad unit ID
    default: 'test-rewarded-ad-unit-id'
  }),
  testDeviceIds: [
    // Add your test device IDs here
    // 'DEVICE_ID_1',
    // 'DEVICE_ID_2',
  ]
};

export type { AdMobConfig, AdReward };