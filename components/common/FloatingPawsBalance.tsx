import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { PawPrint, Crown } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { usePaws } from '@/contexts/PawsContext';

type FloatingPawsBalanceProps = {
  balance?: number; // Made optional since we get it from context
};

export default function FloatingPawsBalance({ balance }: FloatingPawsBalanceProps) {
  const { pawsBalance, maxPaws, isSubscribed } = usePaws();
  
  const displayBalance = balance !== undefined ? balance : pawsBalance;

  return (
    <TouchableOpacity 
      style={[styles.container, isSubscribed && styles.subscribedContainer]}
      onPress={() => router.push('/(tabs)/store')}
    >
      {isSubscribed ? (
        <>
          <Crown size={20} color={COLORS.primary} />
          <Text style={[styles.balanceText, styles.subscribedText]}>Premium</Text>
        </>
      ) : (
        <>
          <PawPrint size={20} color={COLORS.primary} />
          <Text style={styles.balanceText}>{displayBalance}/{maxPaws}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscribedContainer: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  balanceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  subscribedText: {
    color: COLORS.primary,
  },
});