import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@/constants/theme';
import { getAvatarSource } from '@/utils/avatarUtils';
import { getDogAvatarSource } from '@/utils/dogAvatarUtils';

interface UserAvatarProps {
  userId: string;
  photoURL?: string | null;
  userName?: string;
  size?: number;
  showFallback?: boolean;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackTextStyle?: TextStyle;
  isDogAvatar?: boolean;
  dogBreed?: string;
}

export default function UserAvatar({
  userId,
  photoURL,
  userName = 'User',
  size = 50,
  showFallback = true,
  style,
  containerStyle,
  fallbackTextStyle,
  isDogAvatar = false,
  dogBreed,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const avatarSource = isDogAvatar 
    ? getDogAvatarSource(userId, photoURL, dogBreed)
    : getAvatarSource(userId, photoURL);
  
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

  // If image failed to load and we want to show fallback
  if (imageError && showFallback) {
    return (
      <View style={[
        containerStyles,
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

  return (
    <View style={containerStyles}>
      <Image
        source={avatarSource}
        style={avatarStyle}
        onError={() => setImageError(true)}
        resizeMode="cover"
      />
    </View>
  );
}