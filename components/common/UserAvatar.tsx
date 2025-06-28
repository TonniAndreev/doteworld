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
  const { photoUrl: userPhotoUrl, isLoading: userPhotoLoading } = useUserProfilePhoto(isDogAvatar ? undefined : userId);
  const { photoUrl: dogPhotoUrl, isLoading: dogPhotoLoading } = useDogProfilePhoto(isDogAvatar ? userId : '');
  
  // Determine the final photo URL to use
  let finalPhotoUrl = isDogAvatar ? (dogPhotoUrl || photoURL) : (userPhotoUrl || photoURL);
  
  // For debugging - remove in production
  console.log(`Avatar for ${isDogAvatar ? 'dog' : 'user'} ${userId}: using ${finalPhotoUrl}`);
  
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

  // If image is still loading, show loading state
  const isLoading = isDogAvatar ? dogPhotoLoading : userPhotoLoading;

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

  // Default fallback image for different entities
  const defaultImage = isDogAvatar 
    ? { uri: `https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=${size*2}&h=${size*2}` }
    : { uri: `https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=${size*2}&h=${size*2}` };

  return (
    <View style={containerStyles}>
      <Image
        source={finalPhotoUrl ? 
          (typeof finalPhotoUrl === 'string' ? { uri: finalPhotoUrl } : finalPhotoUrl) : 
          defaultImage
        }
        style={avatarStyle}
        onError={(e) => {
          console.warn(`Image load error for ${isDogAvatar ? 'dog' : 'user'} ${userId}:`, e.nativeEvent.error);
          setImageError(true);
        }}
        resizeMode="cover"
      />
    </View>
  );
}