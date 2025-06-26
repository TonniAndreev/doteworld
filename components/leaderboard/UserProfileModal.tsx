import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { X, UserPlus, UserCheck, UserX, MapPin } from 'lucide-react-native';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';
import UserAvatar from '@/components/common/UserAvatar';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    dogName: string;
    photoURL?: string | null;
    territorySize: number;
    achievementCount: number;
    totalDistance: number;
  } | null;
}

// Mock territory data - in a real app, this would be fetched from your backend
const generateMockTerritory = (userId: string) => {
  // Generate a consistent territory based on user ID
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Base coordinates (you can adjust these for your area)
  const baseLat = 37.7749 + (Math.abs(hash) % 1000) / 10000;
  const baseLng = -122.4194 + (Math.abs(hash * 2) % 1000) / 10000;
  
  // Generate a polygon around the base coordinates
  const radius = 0.002; // Adjust size as needed
  const points = [];
  const numPoints = 6 + (Math.abs(hash) % 4); // 6-9 points
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const variance = 0.3 + (Math.abs(hash * (i + 1)) % 100) / 200; // 0.3-0.8
    const lat = baseLat + Math.cos(angle) * radius * variance;
    const lng = baseLng + Math.sin(angle) * radius * variance;
    points.push({ latitude: lat, longitude: lng });
  }
  
  return {
    coordinates: points,
    center: { latitude: baseLat, longitude: baseLng },
  };
};

export default function UserProfileModal({ visible, onClose, user }: UserProfileModalProps) {
  const [territory, setTerritory] = useState<any>(null);
  const [isLoadingTerritory, setIsLoadingTerritory] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'friend' | 'pending'>('none');
  const [userDogs, setUserDogs] = useState<any[]>([]);
  const [isLoadingDogs, setIsLoadingDogs] = useState(false);
  
  const { friends, sendFriendRequest } = useFriends();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (visible && user) {
      // Check friendship status
      const isFriend = friends.some(friend => friend.id === user.id);
      setFriendshipStatus(isFriend ? 'friend' : 'none');
      
      // Load user's dogs
      loadUserDogs();
      
      // Load territory data
      setIsLoadingTerritory(true);
      // Simulate API call
      setTimeout(() => {
        const mockTerritory = generateMockTerritory(user.id);
        setTerritory(mockTerritory);
        setIsLoadingTerritory(false);
      }, 500);
    }
  }, [visible, user, friends]);

  const loadUserDogs = async () => {
    if (!user) return;
    
    setIsLoadingDogs(true);
    try {
      console.log('Loading dogs for user:', user.id);
      
      const { data: dogData, error } = await supabase
        .from('profile_dogs')
        .select(`
          dogs (
            id,
            name,
            breed,
            photo_url
          )
        `)
        .eq('profile_id', user.id);

      if (error) {
        console.error('Error fetching user dogs:', error);
        setUserDogs([]);
      } else {
        console.log('Raw dog data:', dogData);
        const dogs = dogData?.map(pd => pd.dogs).filter(Boolean) || [];
        console.log('Processed dogs:', dogs);
        setUserDogs(dogs);
      }
    } catch (error) {
      console.error('Error loading user dogs:', error);
      setUserDogs([]);
    } finally {
      setIsLoadingDogs(false);
    }
  };

  const handleFriendAction = async () => {
    if (!user) return;
    
    if (friendshipStatus === 'friend') {
      // Unfriend action
      // You can implement unfriend functionality here if needed
      console.log('Unfriend functionality not implemented yet');
    } else if (friendshipStatus === 'none') {
      // Send friend request
      setFriendshipStatus('pending');
      await sendFriendRequest(user.id);
      console.log('Friend request sent to:', user.id);
    }
  };

  const getFriendButtonContent = () => {
    switch (friendshipStatus) {
      case 'friend':
        return {
          icon: <UserX size={20} color={COLORS.white} />,
          text: 'Unfriend',
          style: styles.unfriendButton,
        };
      case 'pending':
        return {
          icon: <UserCheck size={20} color={COLORS.neutralDark} />,
          text: 'Request Sent',
          style: styles.pendingButton,
        };
      default:
        return {
          icon: <UserPlus size={20} color={COLORS.white} />,
          text: 'Add Friend',
          style: styles.addFriendButton,
        };
    }
  };

  if (!user) return null;

  const friendButton = getFriendButtonContent();
  const isCurrentUserProfile = user.id === currentUser?.id;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={COLORS.neutralDark} />
          </TouchableOpacity>

          {/* Territory Map Section */}
          <View style={styles.mapSection}>
            <View style={styles.mapHeader}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.mapTitle}>Territory</Text>
            </View>
            
            <View style={styles.mapContainer}>
              {isLoadingTerritory ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading territory...</Text>
                </View>
              ) : territory ? (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: territory.center.latitude,
                    longitude: territory.center.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                >
                  <Polygon
                    coordinates={territory.coordinates}
                    fillColor="rgba(241, 102, 46, 0.3)"
                    strokeColor={COLORS.primary}
                    strokeWidth={2}
                  />
                </MapView>
              ) : (
                <View style={styles.mapError}>
                  <Text style={styles.errorText}>Unable to load territory</Text>
                </View>
              )}
            </View>
          </View>

          {/* User Info Section */}
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <UserAvatar
                userId={user.id}
                photoURL={user.photoURL}
                userName={user.name}
                size={80}
              />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              {isLoadingDogs ? (
                <Text style={styles.dogName}>Loading...</Text>
              ) : userDogs.length > 0 ? (
                <Text style={styles.dogName}>{userDogs[0].name}</Text>
              ) : (
                <Text style={styles.dogName}>No dog</Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.territorySize.toFixed(1)} km²</Text>
                <Text style={styles.statLabel}>Territory</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.achievementCount}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.totalDistance.toFixed(1)} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            {/* Friend Action Button */}
            {!isCurrentUserProfile && (
              <TouchableOpacity 
                style={[styles.actionButton, friendButton.style]}
                onPress={handleFriendAction}
                disabled={friendshipStatus === 'pending'}
              >
                {friendButton.icon}
                <Text style={[
                  styles.actionButtonText,
                  friendshipStatus === 'pending' && styles.pendingButtonText
                ]}>
                  {friendButton.text}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapSection: {
    flex: 1,
    backgroundColor: COLORS.neutralExtraLight,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  mapTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.neutralLight,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutralExtraLight,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  mapError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutralExtraLight,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  userSection: {
    backgroundColor: COLORS.white,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  dogName: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.neutralMedium,
    alignSelf: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },
  addFriendButton: {
    backgroundColor: COLORS.primary,
  },
  unfriendButton: {
    backgroundColor: COLORS.error,
  },
  pendingButton: {
    backgroundColor: COLORS.neutralLight,
    borderWidth: 1,
    borderColor: COLORS.neutralMedium,
  },
  actionButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  pendingButtonText: {
    color: COLORS.neutralDark,
  },
});