import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const PawsContext = createContext();

export function PawsProvider({ children }) {
  const [pawsBalance, setPawsBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
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
            const initialTransaction = {
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

  const addPaws = async (amount, description = 'Earned paws') => {
    if (!user) return;
    
    const newBalance = pawsBalance + amount;
    setPawsBalance(newBalance);
    
    const newTransaction = {
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

  const spendPaws = async (amount, description = 'Spent paws') => {
    if (!user) return;
    if (pawsBalance < amount) {
      throw new Error('Insufficient paws balance');
    }
    
    const newBalance = pawsBalance - amount;
    setPawsBalance(newBalance);
    
    const newTransaction = {
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

  const value = {
    pawsBalance,
    transactions,
    addPaws,
    spendPaws,
  };

  return <PawsContext.Provider value={value}>{children}</PawsContext.Provider>;
}

export const usePaws = () => useContext(PawsContext);