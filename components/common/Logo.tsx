import React from 'react';
import { View, Image } from 'react-native';
import { COLORS } from '@/constants/theme';

interface LogoProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function Logo({ 
  width = 100, 
  height = 100, 
  color = COLORS.primary 
}: LogoProps) {
  // For now, we'll use a placeholder since React Native doesn't handle SVG files directly
  // In a production app, you'd want to convert the SVG to a PNG or use react-native-svg
  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=200&h=200' }}
        style={{ width, height, borderRadius: width / 2 }}
        resizeMode="cover"
      />
    </View>
  );
}