import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { X, UserPlus, UserCheck, UserX } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';
import UserAvatar from '@/components/common/UserAvatar';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';

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

export default function UserProfileModal({ visible, onClose, user }: UserProfileModalProps) {
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'friend' | 'pending' | 'sent'>('none');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userDogs, setUserDogs] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userStats, setUserStats] = useState({
    territorySize: 0,
    achievementCount: 0,
    totalDistance: 0,
  });
  
  const { friends, sendFriendRequest, removeFriend } = useFriends();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (visible && user) {
      loadUserData();
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

      // Get user's dogs with more detailed query
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
        console.log('Raw dog data for user:', user.id, dogData);
        const dogs = dogData?.map(pd => pd.dogs).filter(Boolean) || [];
        console.log('Processed dogs:', dogs);
        setUserDogs(dogs);
      }

      // Get achievement count
      const { count: achievementCount } = await supabase
        .from('profile_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id);

      // Calculate territory size and distance from walk points
      let territorySize = 0;
      let totalDistance = 0;

      if (dogData && dogData.length > 0) {
        const dogIds = dogData.map(pd => pd.dogs?.id).filter(Boolean);
        
        if (dogIds.length > 0) {
          // Get walk points for all user's dogs
          const { data: walkPoints, error: walkError } = await supabase
            .from('walk_points')
            .select('latitude, longitude, walk_session_id, timestamp')
            .in('dog_id', dogIds)
            .order('timestamp', { ascending: true });

          if (walkPoints && walkPoints.length > 0) {
            console.log('Walk points found:', walkPoints.length);
            
            // Group by walk session to calculate distances properly
            const sessionGroups = walkPoints.reduce((groups, point) => {
              if (!groups[point.walk_session_id]) {
                groups[point.walk_session_id] = [];
              }
              groups[point.walk_session_id].push(point);
              return groups;
            }, {} as Record<string, any[]>);

            // Calculate total distance across all sessions
            Object.values(sessionGroups).forEach(sessionPoints => {
              if (sessionPoints.length > 1) {
                for (let i = 1; i < sessionPoints.length; i++) {
                  const prev = sessionPoints[i - 1];
                  const curr = sessionPoints[i];
                  const distance = calculateDistance(
                    prev.latitude,
                    prev.longitude,
                    curr.latitude,
                    curr.longitude
                  );
                  totalDistance += distance;
                }
              }
            });

            // Simple territory calculation: assume each walk point represents ~0.001 km²
            territorySize = walkPoints.length * 0.001;
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
    } else if (friendshipStatus === 'friend') {
      // Unfriend
      await removeFriend(user.id);
      setFriendshipStatus('none');
    }
  };

  const getFriendButtonContent = () => {
    switch (friendshipStatus) {
      case 'friend':
        return {
          icon: <UserX size={20} color={COLORS.white} />,
          text: 'Unfriend',
          style: [styles.actionButton, styles.unfriendButton],
          disabled: false,
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
  
  // Use the actual dog name from database, fallback to user.dogName if no dogs found
  const displayDogName = userDogs.length > 0 ? userDogs[0].name : (user.dogName !== 'No dog' ? user.dogName : 'No dog');

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
                    size={100}
                  />
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{displayName}</Text>
                  {displayDogName !== 'No dog' && (
                    <Text style={styles.dogName}>{displayDogName}</Text>
                  )}
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
    width: '90%',
    maxWidth: 400,
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
  userSection: {
    backgroundColor: COLORS.white,
    padding: 32,
    alignItems: 'center',
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  dogName: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 16,
    marginBottom: 32,
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
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
  disabledButtonText: {
    color: COLORS.neutralDark,
  },
});