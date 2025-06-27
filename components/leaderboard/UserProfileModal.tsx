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

// Generate mock territory data based on user ID for consistent display
const generateMockTerritory = (userId: string) => {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Base coordinates around San Francisco area
  const baseLat = 37.7749 + (Math.abs(hash) % 1000) / 10000;
  const baseLng = -122.4194 + (Math.abs(hash * 2) % 1000) / 10000;
  
  // Generate a polygon around the base coordinates
  const radius = 0.002;
  const points = [];
  const numPoints = 6 + (Math.abs(hash) % 4);
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const variance = 0.3 + (Math.abs(hash * (i + 1)) % 100) / 200;
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
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'friend' | 'pending' | 'sent'>('none');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userDogs, setUserDogs] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userStats, setUserStats] = useState({
    territorySize: 0,
    achievementCount: 0,
    totalDistance: 0,
  });
  
  const { friends, sendFriendRequest } = useFriends();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (visible && user) {
      loadUserData();
      loadTerritory();
      checkFriendshipStatus();
    }
  }, [visible, user, friends]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else {
        setUserProfile(profile);
      }

      // Get user's dogs
      const { data: dogData, error: dogError } = await supabase
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

      if (dogError) {
        console.error('Error fetching user dogs:', dogError);
        setUserDogs([]);
      } else {
        const dogs = dogData?.map(pd => pd.dogs).filter(Boolean) || [];
        setUserDogs(dogs);
      }

      // Get achievement count
      const { count: achievementCount } = await supabase
        .from('profile_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id);

      // Calculate territory size from walk points (simplified calculation)
      let territorySize = 0;
      let totalDistance = 0;

      if (dogs.length > 0) {
        const { data: walkPoints, error: walkError } = await supabase
          .from('walk_points')
          .select('latitude, longitude')
          .eq('dog_id', dogs[0].id);

        if (walkPoints && walkPoints.length > 0) {
          // Simple calculation: assume each walk point represents ~0.001 km²
          territorySize = walkPoints.length * 0.001;
          
          // Calculate total distance (simplified)
          if (walkPoints.length > 1) {
            for (let i = 1; i < walkPoints.length; i++) {
              const prev = walkPoints[i - 1];
              const curr = walkPoints[i];
              const distance = calculateDistance(
                prev.latitude,
                prev.longitude,
                curr.latitude,
                curr.longitude
              );
              totalDistance += distance;
            }
          }
        }
      }

      setUserStats({
        territorySize,
        achievementCount: achievementCount || 0,
        totalDistance,
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadTerritory = () => {
    if (!user) return;
    
    setIsLoadingTerritory(true);
    // Simulate loading time for territory
    setTimeout(() => {
      const mockTerritory = generateMockTerritory(user.id);
      setTerritory(mockTerritory);
      setIsLoadingTerritory(false);
    }, 500);
  };

  const checkFriendshipStatus = async () => {
    if (!user || !currentUser) return;

    // Check if already friends
    const isFriend = friends.some(friend => friend.id === user.id);
    if (isFriend) {
      setFriendshipStatus('friend');
      return;
    }

    // Check if there's a pending request
    try {
      const { data: existingRequest, error } = await supabase
        .from('friendships')
        .select('status, requester_id, receiver_id')
        .or(`and(requester_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(requester_id.eq.${user.id},receiver_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (error) {
        console.error('Error checking friendship status:', error);
        setFriendshipStatus('none');
        return;
      }

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          // Check if current user sent the request
          if (existingRequest.requester_id === currentUser.id) {
            setFriendshipStatus('sent');
          } else {
            setFriendshipStatus('pending');
          }
        } else {
          setFriendshipStatus('none');
        }
      } else {
        setFriendshipStatus('none');
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
      setFriendshipStatus('none');
    }
  };

  const handleFriendAction = async () => {
    if (!user || !currentUser) return;
    
    if (friendshipStatus === 'none') {
      // Send friend request
      setFriendshipStatus('sent');
      await sendFriendRequest(user.id);
    }
  };

  const getFriendButtonContent = () => {
    switch (friendshipStatus) {
      case 'friend':
        return {
          icon: <UserCheck size={20} color={COLORS.success} />,
          text: 'Friends',
          style: [styles.actionButton, styles.friendButton],
          disabled: true,
        };
      case 'pending':
        return {
          icon: <UserCheck size={20} color={COLORS.neutralDark} />,
          text: 'Request Received',
          style: [styles.actionButton, styles.pendingButton],
          disabled: true,
        };
      case 'sent':
        return {
          icon: <UserCheck size={20} color={COLORS.neutralDark} />,
          text: 'Request Sent',
          style: [styles.actionButton, styles.pendingButton],
          disabled: true,
        };
      default:
        return {
          icon: <UserPlus size={20} color={COLORS.white} />,
          text: 'Add Friend',
          style: [styles.actionButton, styles.addFriendButton],
          disabled: false,
        };
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  if (!user) return null;

  const friendButton = getFriendButtonContent();
  const isCurrentUserProfile = user.id === currentUser?.id;
  const displayName = userProfile ? 
    `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.name :
    user.name;
  const displayDogName = userDogs.length > 0 ? userDogs[0].name : user.dogName;

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
            {isLoadingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : (
              <>
                <View style={styles.avatarContainer}>
                  <UserAvatar
                    userId={user.id}
                    photoURL={userProfile?.avatar_url || user.photoURL}
                    userName={displayName}
                    size={80}
                  />
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.dogName}>{displayDogName}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.territorySize.toFixed(1)} km²</Text>
                    <Text style={styles.statLabel}>Territory</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.achievementCount}</Text>
                    <Text style={styles.statLabel}>Badges</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.totalDistance.toFixed(1)} km</Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>
                </View>

                {/* Friend Action Button */}
                {!isCurrentUserProfile && (
                  <TouchableOpacity 
                    style={friendButton.style}
                    onPress={handleFriendAction}
                    disabled={friendButton.disabled}
                  >
                    {friendButton.icon}
                    <Text style={[
                      styles.actionButtonText,
                      friendButton.disabled && styles.disabledButtonText
                    ]}>
                      {friendButton.text}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  friendButton: {
    backgroundColor: COLORS.success,
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
  disabledButtonText: {
    color: COLORS.neutralDark,
  },
});