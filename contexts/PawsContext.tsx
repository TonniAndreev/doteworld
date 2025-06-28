import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { adMobService, ADMOB_CONFIG } from '@/services/adMobService';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
}

interface DailyData {
  date: string;
  adsWatched: number;
  pawsEarned: number;
}

interface PawsContextType {
  pawsBalance: number;
  maxPaws: number;
  dailyAdsWatched: number;
  maxDailyAds: number;
  isSubscribed: boolean;
  transactions: Transaction[];
  canStartConquest: boolean;
  timeUntilNextPaw: number;
  addPaws: (amount: number, description?: string) => Promise<void>;
  spendPaws: (amount: number, description?: string) => Promise<void>;
  watchAd: () => Promise<boolean>;
  startConquest: () => Promise<boolean>;
  setSubscriptionStatus: (subscribed: boolean) => void;
}

const PawsContext = createContext<PawsContextType | undefined>(undefined);

export function PawsProvider({ children }: { children: ReactNode }) {
  const [pawsBalance, setPawsBalance] = useState(0);
  const [dailyAdsWatched, setDailyAdsWatched] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeUntilNextPaw, setTimeUntilNextPaw] = useState(0);
  const [isAdMobInitialized, setIsAdMobInitialized] = useState(false);
  const { user } = useAuth();

  const maxPaws = 5;
  const maxDailyAds = 2;

  // Initialize AdMob when the context is created
  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        console.log('PawsContext: Initializing AdMob...');
        await adMobService.initialize(ADMOB_CONFIG);
        setIsAdMobInitialized(true);
        console.log('PawsContext: AdMob initialized successfully');
      } catch (error) {
        console.error('PawsContext: Failed to initialize AdMob:', error);
        // Continue without AdMob - ads will fall back to mock behavior
        setIsAdMobInitialized(false);
      }
    };

    initializeAdMob();
  }, []);

  useEffect(() => {
    const loadPawsData = async () => {
      if (user) {
        try {
          const [
            savedPaws,
            savedTransactions,
            savedDailyData,
            savedSubscription
          ] = await Promise.all([
            AsyncStorage.getItem(`dote_paws_${user.uid}`),
            AsyncStorage.getItem(`dote_transactions_${user.uid}`),
            AsyncStorage.getItem(`dote_daily_data_${user.uid}`),
            AsyncStorage.getItem(`dote_subscription_${user.uid}`)
          ]);

          // Load subscription status
          if (savedSubscription) {
            setIsSubscribed(JSON.parse(savedSubscription));
          }

          // Check if it's a new day and reset daily data
          const today = new Date().toDateString();
          let dailyData: DailyData = { date: today, adsWatched: 0, pawsEarned: 0 };
          
          if (savedDailyData) {
            const parsedDailyData = JSON.parse(savedDailyData);
            if (parsedDailyData.date === today) {
              dailyData = parsedDailyData;
            } else {
              // New day - give free paw if not at max
              const currentPaws = savedPaws ? parseInt(savedPaws, 10) : 0;
              if (currentPaws < maxPaws) {
                const newPaws = Math.min(currentPaws + 1, maxPaws);
                setPawsBalance(newPaws);
                await AsyncStorage.setItem(`dote_paws_${user.uid}`, newPaws.toString());
                
                // Add transaction for daily paw
                const dailyPawTransaction: Transaction = {
                  id: Date.now().toString(),
                  type: 'credit',
                  amount: 1,
                  description: 'Daily free paw',
                  timestamp: new Date().toISOString(),
                };
                
                const updatedTransactions = savedTransactions 
                  ? [...JSON.parse(savedTransactions), dailyPawTransaction]
                  : [dailyPawTransaction];
                
                setTransactions(updatedTransactions);
                await AsyncStorage.setItem(
                  `dote_transactions_${user.uid}`,
                  JSON.stringify(updatedTransactions)
                );
              } else {
                setPawsBalance(currentPaws);
              }
              
              // Reset daily data for new day
              await AsyncStorage.setItem(`dote_daily_data_${user.uid}`, JSON.stringify(dailyData));
            }
          } else {
            // First time user - give initial paw
            setPawsBalance(1);
            await AsyncStorage.setItem(`dote_paws_${user.uid}`, '1');
            
            const initialTransaction: Transaction = {
              id: '1',
              type: 'credit',
              amount: 1,
              description: 'Welcome paw',
              timestamp: new Date().toISOString(),
            };
            setTransactions([initialTransaction]);
            await AsyncStorage.setItem(
              `dote_transactions_${user.uid}`,
              JSON.stringify([initialTransaction])
            );
            await AsyncStorage.setItem(`dote_daily_data_${user.uid}`, JSON.stringify(dailyData));
          }

          setDailyAdsWatched(dailyData.adsWatched);

          // Load existing paws if not already set
          if (savedPaws && dailyData.date === today) {
            setPawsBalance(parseInt(savedPaws, 10));
          }

          // Load existing transactions if not already set
          if (savedTransactions && transactions.length === 0) {
            setTransactions(JSON.parse(savedTransactions));
          }

        } catch (error) {
          console.error('Error loading paws data:', error);
        }
      }
    };

    loadPawsData();
  }, [user]);

  // Update countdown timer for next free paw
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeLeft = tomorrow.getTime() - now.getTime();
      setTimeUntilNextPaw(Math.max(0, timeLeft));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const canStartConquest = isSubscribed || pawsBalance > 0;

  const addPaws = async (amount: number, description = 'Earned paws') => {
    if (!user) return;
    
    const newBalance = Math.min(pawsBalance + amount, maxPaws);
    setPawsBalance(newBalance);
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'credit',
      amount,
      description,
      timestamp: new Date().toISOString(),
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    
    await Promise.all([
      AsyncStorage.setItem(`dote_paws_${user.uid}`, newBalance.toString()),
      AsyncStorage.setItem(`dote_transactions_${user.uid}`, JSON.stringify(updatedTransactions)),
    ]);
  };

  const spendPaws = async (amount: number, description = 'Spent paws') => {
    if (!user || isSubscribed) return; // Subscribers don't spend paws
    if (pawsBalance < amount) {
      throw new Error('Insufficient paws balance');
    }
    
    const newBalance = pawsBalance - amount;
    setPawsBalance(newBalance);
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'debit',
      amount,
      description,
      timestamp: new Date().toISOString(),
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    
    await Promise.all([
      AsyncStorage.setItem(`dote_paws_${user.uid}`, newBalance.toString()),
      AsyncStorage.setItem(`dote_transactions_${user.uid}`, JSON.stringify(updatedTransactions)),
    ]);
  };

  const watchAd = async (): Promise<boolean> => {
    if (!user || dailyAdsWatched >= maxDailyAds || pawsBalance >= maxPaws) {
      return false;
    }

    try {
      console.log('PawsContext: Starting ad watch process...');
      
      // Load the ad first
      console.log('PawsContext: Loading rewarded ad...');
      await adMobService.loadRewardedAd();
      
      // Show the ad and wait for completion
      console.log('PawsContext: Showing rewarded ad...');
      const reward = await adMobService.showRewardedAd();
      
      console.log('PawsContext: Ad completed successfully, reward:', reward);
      
      // Award paw
      await addPaws(reward.amount, 'Watched rewarded ad');
      
      // Update daily ad count
      const newAdsWatched = dailyAdsWatched + 1;
      setDailyAdsWatched(newAdsWatched);
      
      const today = new Date().toDateString();
      const dailyData: DailyData = {
        date: today,
        adsWatched: newAdsWatched,
        pawsEarned: 0 // This could track daily paws earned
      };
      
      await AsyncStorage.setItem(`dote_daily_data_${user.uid}`, JSON.stringify(dailyData));
      
      return true;
    } catch (error) {
      console.error('PawsContext: Error watching ad:', error);
      
      // If it's just a user cancellation, don't show an error
      if (error instanceof Error && error.message.includes('closed without earning reward')) {
        console.log('PawsContext: User closed ad without completing it');
        return false;
      }
      
      // For other errors, still return false but log the error
      console.error('PawsContext: Ad failed to load or show:', error);
      return false;
    }
  };

  const startConquest = async (): Promise<boolean> => {
    if (!user) return false;
    
    if (isSubscribed) {
      // Subscribers can always start conquest
      return true;
    }
    
    if (pawsBalance <= 0) {
      // No paws available
      return false;
    }
    
    // Spend 1 paw to start conquest
    await spendPaws(1, 'Started conquest');
    return true;
  };

  const setSubscriptionStatus = async (subscribed: boolean) => {
    if (!user) return;
    
    setIsSubscribed(subscribed);
    await AsyncStorage.setItem(`dote_subscription_${user.uid}`, JSON.stringify(subscribed));
  };

  const value: PawsContextType = {
    pawsBalance,
    maxPaws,
    dailyAdsWatched,
    maxDailyAds,
    isSubscribed,
    transactions,
    canStartConquest,
    timeUntilNextPaw,
    addPaws,
    spendPaws,
    watchAd,
    startConquest,
    setSubscriptionStatus,
  };

  return <PawsContext.Provider value={value}>{children}</PawsContext.Provider>;
}

export const usePaws = () => {
  const context = useContext(PawsContext);
  if (!context) throw new Error("usePaws must be used inside PawsProvider");
  return context;
};