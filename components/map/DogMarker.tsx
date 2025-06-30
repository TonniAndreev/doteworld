import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { Marker } from 'react-native-maps';
import { COLORS } from '@/constants/theme';
import { getDogAvatarSource } from '@/utils/dogAvatarUtils';

interface DogMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  dogId: string;
  dogName: string;
  dogPhotoURL?: string | null;
  dogBreed?: string;
  color: string;
  onPress?: () => void;
}

const DogMarker: React.FC<DogMarkerProps> = ({
  coordinate,
  dogId,
  dogName,
  dogPhotoURL,
  dogBreed,
  color,
  onPress
}) => {
  const [tracksChanges, setTracksChanges] = useState(true);
  
  // Get the avatar source directly instead of using UserAvatar component
  const avatarSource = getDogAvatarSource(dogId, dogPhotoURL, dogBreed);
  
  console.log(`Rendering dog marker for ${dogName} at ${coordinate.latitude}, ${coordinate.longitude}`);
  
  // Set tracksViewChanges to false after initial render to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksChanges(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={tracksChanges}
      onPress={onPress}
      zIndex={999}
      anchor={{x: 0.5, y: 0.5}}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.avatarContainer, { borderColor: color }]}>
          <Image 
            source={avatarSource}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>
        <View style={[styles.nameContainer, { backgroundColor: color }]}>
          <Text style={styles.nameText} numberOfLines={1}>
            {dogName}
          </Text>
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120, // Fixed width to ensure consistent sizing
    ...Platform.select({
      android: {
        position: 'relative',
        zIndex: 999,
      }
    })
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      }
    })
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  nameContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
    minWidth: 80,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      }
    })
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      android: {
        // Android doesn't support text shadows well, so we use a different approach
        fontWeight: 'bold',
      }
    })
  },
});

export default DogMarker;