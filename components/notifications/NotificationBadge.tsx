import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function NotificationBadge({ 
  count, 
  size = 'medium',
  style 
}: NotificationBadgeProps) {
  if (count <= 0) return null;
  
  const displayCount = count > 99 ? '99+' : count.toString();
  
  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return {
          width: 16,
          height: 16,
          fontSize: 10,
          minWidth: 16,
        };
      case 'large':
        return {
          width: 24,
          height: 24,
          fontSize: 14,
          minWidth: 24,
        };
      case 'medium':
      default:
        return {
          width: 20,
          height: 20,
          fontSize: 12,
          minWidth: 20,
        };
    }
  };
  
  const { width, height, fontSize, minWidth } = getBadgeSize();
  
  return (
    <View 
      style={[
        styles.badge, 
        { 
          width, 
          height, 
          minWidth: displayCount.length > 1 ? minWidth + 4 : minWidth 
        },
        style
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    fontFamily: 'Inter-Bold',
    color: COLORS.white,
    textAlign: 'center',
  },
});