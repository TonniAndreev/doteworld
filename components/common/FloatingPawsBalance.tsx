import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { PawPrint } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

type FloatingPawsBalanceProps = {
  balance: number;
};

export default function FloatingPawsBalance({ balance }: FloatingPawsBalanceProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push('/(tabs)/store')}
    >
      <PawPrint size={20} color={COLORS.primary} />
      <Text style={styles.balanceText}>{balance}</Text>
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
  balanceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
});