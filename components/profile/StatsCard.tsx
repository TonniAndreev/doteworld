import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

interface StatsCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  emphasis?: boolean;
}

export default function StatsCard({ icon, value, label, emphasis = false }: StatsCardProps) {
  return (
    <View style={[styles.container, emphasis && styles.emphasisContainer]}>
      <View style={[styles.iconContainer, emphasis && styles.emphasisIconContainer]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.value, emphasis && styles.emphasisValue]}>{value}</Text>
        <Text style={[styles.label, emphasis && styles.emphasisLabel]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emphasisContainer: {
    backgroundColor: COLORS.primaryExtraLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  iconContainer: {
    marginRight: 12,
  },
  emphasisIconContainer: {
    backgroundColor: COLORS.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  emphasisValue: {
    color: COLORS.primary,
    fontSize: 22,
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  emphasisLabel: {
    color: COLORS.primary,
    fontFamily: 'Inter-Medium',
  },
});