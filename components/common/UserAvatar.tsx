import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useUserProfilePhoto } from '@/hooks/useUserProfilePhoto';
import { useDogProfilePhoto } from '@/hooks/useDogProfilePhoto';

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
  
  // Use hooks to get photo URLs from Supabase Storage
  const { photoUrl: userPhotoUrl } = useUserProfilePhoto(isDogAvatar ? undefined : userId);
  const { photoUrl: dogPhotoUrl } = useDogProfilePhoto(isDogAvatar ? userId : '');
  
  // Determine the final photo URL to use
  const finalPhotoUrl = isDogAvatar ? (dogPhotoUrl || photoURL) : (userPhotoUrl || photoURL);
  
  const avatarStyle: any = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style
  ];

  const containerStyles: any = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
    },
    containerStyle
  ];

  // If image failed to load and we want to show fallback
  if ((imageError || !finalPhotoUrl) && showFallback) {
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
        source={finalPhotoUrl ? { uri: finalPhotoUrl } : { uri: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300' }}
        style={avatarStyle}
        onError={() => setImageError(true)}
        resizeMode="cover"
      />
    </View>
  );
}