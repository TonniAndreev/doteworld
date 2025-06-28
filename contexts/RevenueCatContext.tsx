import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

interface SubscriptionPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

interface CustomerInfo {
  originalAppUserId: string;
  entitlements: {
    active: { [key: string]: any };
    all: { [key: string]: any };
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
}

interface RevenueCatContextType {
  isConfigured: boolean;
  customerInfo: CustomerInfo | null;
  offerings: any;
  isLoading: boolean;
  error: string | null;
  configure: (apiKey: string) => Promise<void>;
  getCustomerInfo: () => Promise<CustomerInfo | null>;
  getOfferings: () => Promise<any>;
  purchasePackage: (packageToPurchase: SubscriptionPackage) => Promise<any>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  isSubscribed: (entitlementId: string) => boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock implementation for web/development
  const configure = async (apiKey: string) => {
    if (Platform.OS === 'web') {
      console.log('RevenueCat: Mock configuration for web platform');
      setIsConfigured(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual RevenueCat configuration
      // const Purchases = require('react-native-purchases');
      // await Purchases.configure({ apiKey });
      
      console.log('RevenueCat: Would configure with API key:', apiKey);
      setIsConfigured(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed');
      console.error('RevenueCat configuration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
    if (Platform.OS === 'web') {
      // Mock customer info for web
      const mockCustomerInfo: CustomerInfo = {
        originalAppUserId: 'mock_user_id',
        entitlements: {
          active: {},
          all: {}
        },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: []
      };
      setCustomerInfo(mockCustomerInfo);
      return mockCustomerInfo;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual RevenueCat call
      // const Purchases = require('react-native-purchases');
      // const info = await Purchases.getCustomerInfo();
      
      console.log('RevenueCat: Would fetch customer info');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get customer info');
      console.error('RevenueCat getCustomerInfo error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getOfferings = async () => {
    if (Platform.OS === 'web') {
      // Mock offerings for web
      const mockOfferings = {
        current: {
          monthly: {
            identifier: 'monthly_premium',
            packageType: 'MONTHLY',
            product: {
              identifier: 'premium_monthly',
              description: 'Premium subscription',
              title: 'Premium Monthly',
              price: 4.99,
              priceString: '$4.99',
              currencyCode: 'USD'
            }
          }
        }
      };
      setOfferings(mockOfferings);
      return mockOfferings;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual RevenueCat call
      // const Purchases = require('react-native-purchases');
      // const offerings = await Purchases.getOfferings();
      
      console.log('RevenueCat: Would fetch offerings');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get offerings');
      console.error('RevenueCat getOfferings error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePackage = async (packageToPurchase: SubscriptionPackage) => {
    if (Platform.OS === 'web') {
      console.log('RevenueCat: Mock purchase for web platform:', packageToPurchase.identifier);
      throw new Error('Purchases not available on web platform. Please use a development build.');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual RevenueCat call
      // const Purchases = require('react-native-purchases');
      // const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('RevenueCat: Would purchase package:', packageToPurchase.identifier);
      throw new Error('RevenueCat SDK not configured. Please follow the integration guide.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
      console.error('RevenueCat purchase error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<CustomerInfo | null> => {
    if (Platform.OS === 'web') {
      console.log('RevenueCat: Mock restore for web platform');
      return customerInfo;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual RevenueCat call
      // const Purchases = require('react-native-purchases');
      // const info = await Purchases.restorePurchases();
      
      console.log('RevenueCat: Would restore purchases');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore purchases');
      console.error('RevenueCat restore error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = (entitlementId: string): boolean => {
    if (!customerInfo) return false;
    return customerInfo.entitlements.active[entitlementId] !== undefined;
  };

  const value: RevenueCatContextType = {
    isConfigured,
    customerInfo,
    offerings,
    isLoading,
    error,
    configure,
    getCustomerInfo,
    getOfferings,
    purchasePackage,
    restorePurchases,
    isSubscribed,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) throw new Error("useRevenueCat must be used inside RevenueCatProvider");
  return context;
};