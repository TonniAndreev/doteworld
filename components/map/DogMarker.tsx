import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={false}
      onPress={onPress}
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
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nameContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
  },
});

export default DogMarker;