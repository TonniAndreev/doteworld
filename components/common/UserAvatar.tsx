import React, { useState, useEffect } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
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
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Only use hooks if userId is provided - to avoid unnecessary subscriptions
  const { photoUrl: userPhotoUrl, isLoading: userPhotoLoading } = 
    !isDogAvatar && userId ? useUserProfilePhoto(userId) : { photoUrl: null, isLoading: false };
    
  const { photoUrl: dogPhotoUrl, isLoading: dogPhotoLoading } = 
    isDogAvatar && userId ? useDogProfilePhoto(userId) : { photoUrl: null, isLoading: false };
  
  // Determine the final photo URL to use
  const finalPhotoUrl = isDogAvatar ? (dogPhotoUrl || photoURL) : (userPhotoUrl || photoURL);
  
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
  const isLoading = (isDogAvatar ? dogPhotoLoading : userPhotoLoading) || loadingImage;
  
  if (isLoading) {
    return (
      <View style={[
        containerStyles,
        {
          backgroundColor: COLORS.neutralLight,
          justifyContent: 'center',
          alignItems: 'center',
        }
      ]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  // If image failed to load or no URL is available and we want to show fallback
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
          { uri: finalPhotoUrl, cache: 'reload' } : 
          defaultImage
        }
        style={avatarStyle}
        onLoadStart={() => setLoadingImage(true)}
        onLoadEnd={() => setLoadingImage(false)}
        onError={(e) => {
          console.error(`Image load error for ${isDogAvatar ? 'dog' : 'user'} ${userId}:`, e.nativeEvent.error);
          setImageError(true);
          setLoadingImage(false);
        }}
        resizeMode="cover"
      />
    </View>
  );
}