import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
}

interface PawsContextType {
  pawsBalance: number;
  transactions: Transaction[];
  addPaws: (amount: number, description?: string) => Promise<void>;
  spendPaws: (amount: number, description?: string) => Promise<void>;
}

const PawsContext = createContext<PawsContextType | undefined>(undefined);

export function PawsProvider({ children }: { children: ReactNode }) {
  const [pawsBalance, setPawsBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadPawsData = async () => {
      if (user) {
        try {
          const [savedPaws, savedTransactions] = await Promise.all([
            AsyncStorage.getItem(`dote_paws_${user.uid}`),
            AsyncStorage.getItem(`dote_transactions_${user.uid}`),
          ]);

          if (savedPaws) {
            setPawsBalance(parseInt(savedPaws, 10));
          } else {
            setPawsBalance(100);
            await AsyncStorage.setItem(`dote_paws_${user.uid}`, '100');
          }

          if (savedTransactions) {
            setTransactions(JSON.parse(savedTransactions));
          } else {
            const initialTransaction: Transaction = {
              id: '1',
              type: 'credit',
              amount: 100,
              description: 'Welcome bonus',
              timestamp: new Date().toISOString(),
            };
            setTransactions([initialTransaction]);
            await AsyncStorage.setItem(
              `dote_transactions_${user.uid}`,
              JSON.stringify([initialTransaction])
            );
          }
        } catch (error) {
          console.error('Error loading paws data:', error);
        }
      }
    };

    loadPawsData();
  }, [user]);

  const addPaws = async (amount: number, description = 'Earned paws') => {
    if (!user) return;
    
    const newBalance = pawsBalance + amount;
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
    if (!user) return;
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

  const value: PawsContextType = {
    pawsBalance,
    transactions,
    addPaws,
    spendPaws,
  };

  return <PawsContext.Provider value={value}>{children}</PawsContext.Provider>;
}

export const usePaws = () => {
  const context = useContext(PawsContext);
  if (!context) throw new Error("usePaws must be used inside PawsProvider");
  return context;
};