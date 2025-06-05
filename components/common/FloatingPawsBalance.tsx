import { View, Text, StyleSheet } from 'react-native';
import { PawPrint } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

type FloatingPawsBalanceProps = {
  balance: number;
};

export default function FloatingPawsBalance({ balance }: FloatingPawsBalanceProps) {
  return (
    <View style={styles.container}>
      <PawPrint size={20} color={COLORS.primary} />
      <Text style={styles.balanceText}>{balance}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
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
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
});