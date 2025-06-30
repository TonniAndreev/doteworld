import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import UserAvatar from '@/components/common/UserAvatar';
import { COLORS } from '@/constants/theme';

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
  console.log(`Rendering dog marker for ${dogName} at ${coordinate.latitude}, ${coordinate.longitude}`);
  
  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={Platform.OS === 'ios' ? false : true}
      onPress={onPress}
      zIndex={999}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.avatarContainer, { borderColor: color }]}>
          <UserAvatar
            userId={dogId}
            photoURL={dogPhotoURL}
            userName={dogName}
            size={40}
            isDogAvatar={true}
            dogBreed={dogBreed}
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
    zIndex: 999, // Ensure it appears above other map elements
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: COLORS.white, // Explicitly set background color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  nameContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default DogMarker;