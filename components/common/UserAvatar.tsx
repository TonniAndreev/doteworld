import React from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@/constants/theme';
import { getAvatarSource } from '@/utils/avatarUtils';

interface UserAvatarProps {
  userId: string;
  photoURL?: string | null;
  size?: number;
  showFallback?: boolean;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackTextStyle?: TextStyle;
  userName?: string;
}

export default function UserAvatar({
  userId,
  photoURL,
  size = 50,
  showFallback = true,
  style,
  containerStyle,
  fallbackTextStyle,
  userName
}: UserAvatarProps) {
  const avatarSource = getAvatarSource(userId, photoURL);
  
  const avatarStyle = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style
  ];

  const containerStyles = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
    },
    containerStyle
  ];

  return (
    <View style={containerStyles}>
      <Image
        source={avatarSource}
        style={avatarStyle}
        onError={() => {
          // If image fails to load and we want to show fallback
          if (showFallback && userName) {
            return (
              <View style={[
                avatarStyle,
                {
                  backgroundColor: COLORS.primaryLight,
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              ]}>
                <Text style={[
                  {
                    fontFamily: 'Inter-Bold',
                    fontSize: size * 0.4,
                    color: COLORS.primary,
                  },
                  fallbackTextStyle
                ]}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            );
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
});