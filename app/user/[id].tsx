import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, UserPlus, UserCheck, UserMinus, Award, Map, Route, Share2, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';
import UserAvatar from '@/components/common/UserAvatar';
import DogProfileCard from '@/components/profile/DogProfileCard';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
}

interface UserDog {
  id: string;
  name: string;
  breed: string;
  photo_url?: string;
  birthday?: string;
  bio?: string;
  weight?: number;
  gender?: 'male' | 'female';
  created_at: string;
}

interface UserStats {
  territorySize: number;
  totalDistance: number;
  achievementCount: number;
  thisMonthDistance: number;
}

interface UserBadge {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  obtained_at: string;
}

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userDogs, setUserDogs] = useState<UserDog[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    territorySize: 0,
    totalDistance: 0,
    achievementCount: 0,
    thisMonthDistance: 0,
  });
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'friend' | 'pending' | 'sent'>('none');
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);
  
  const { friends, sendFriendRequest, removeFriend, cancelFriendRequest, refetch: refetchFriends } = useFriends();
  const { user: currentUser } = useAuth();

  // Check friendship status first, then load user data
  useEffect(() => {
    if (id && currentUser) {
      checkFriendshipStatus().then(() => {
        loadUserData();
      });
    }
  }, [id, currentUser]);

  const checkFriendshipStatus = async () => {
    if (!id || !currentUser) return;

    try {
      // Check if already friends
      const isFriend = friends.some(friend => friend.id === id);
      if (isFriend) {
        setFriendshipStatus('friend');
        return;
      }

      // Check if there's a pending request
      const { data: existingRequest, error } = await supabase
        .from('friendships')
        .select('status, requester_id, receiver_id')
        .or(`and(requester_id.eq.${currentUser.id},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (error) {
        console.error('Error checking friendship status:', error);
        setFriendshipStatus('none');
        return;
      }

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
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

  const loadUserData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      setUserProfile(profile);

      // Load user's dogs
      const { data: dogData, error: dogError } = await supabase
        .from('profile_dogs')
        .select(`
          dogs (
            id,
            name,
            breed,
            photo_url,
            birthday,
            bio,
            weight,
            gender,
            created_at
          )
        `)
        .eq('profile_id', id);

      if (dogError) {
        console.error('Error fetching user dogs:', dogError);
      } else {
        const dogs = dogData?.map(pd => pd.dogs).filter(Boolean) || [];
        setUserDogs(dogs as UserDog[]);
      }

      // Load user badges
      const { data: badgeData, error: badgeError } = await supabase
        .from('profile_achievements')
        .select(`
          obtained_at,
          achievements (
            id,
            title,
            description,
            icon_url
          )
        `)
        .eq('profile_id', id)
        .not('obtained_at', 'is', null)
        .order('obtained_at', { ascending: false })
        .limit(6);

      if (badgeError) {
        console.error('Error fetching user badges:', badgeError);
      } else {
        const badges = badgeData?.map(ba => ({
          id: ba.achievements.id,
          title: ba.achievements.title,
          description: ba.achievements.description,
          icon_url: ba.achievements.icon_url,
          obtained_at: ba.obtained_at,
        })) || [];
        setUserBadges(badges);
      }

      // Calculate stats from walk points if user has dogs
      if (dogData && dogData.length > 0) {
        const firstDog = dogData[0]?.dogs;
        if (firstDog?.id) {
          const { data: walkPoints, error: walkError } = await supabase
            .from('walk_points')
            .select('latitude, longitude, walk_session_id, timestamp')
            .eq('dog_id', firstDog.id)
            .order('timestamp', { ascending: true });

          if (!walkError && walkPoints && walkPoints.length > 0) {
            const territorySize = calculateRealTerritoryFromWalkPoints(walkPoints);
            const totalDistance = calculateRealDistanceFromWalkPoints(walkPoints);
            
            // Calculate this month's distance
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const thisMonthWalkPoints = walkPoints.filter(point => {
              const pointDate = new Date(point.timestamp);
              return pointDate.getMonth() === currentMonth && 
                     pointDate.getFullYear() === currentYear;
            });
            
            const thisMonthDistance = calculateRealDistanceFromWalkPoints(thisMonthWalkPoints);
            
            // Get achievement count
            const { count: achievementCount } = await supabase
              .from('profile_achievements')
              .select('*', { count: 'exact', head: true })
              .eq('profile_id', id)
              .not('obtained_at', 'is', null);

            setUserStats({
              territorySize,
              totalDistance,
              achievementCount: achievementCount || 0,
              thisMonthDistance,
            });
          }
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user profile');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!id || !currentUser) return;
    
    setIsProcessingFriend(true);
    
    try {
      if (friendshipStatus === 'none') {
        await sendFriendRequest(id);
        setFriendshipStatus('sent');
        Alert.alert('Success', 'Friend request sent!');
      } else if (friendshipStatus === 'friend') {
        Alert.alert(
          'Unfriend User',
          `Are you sure you want to remove ${displayName} from your friends?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessingFriend(false) },
            {
              text: 'Unfriend',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('Removing friend with ID:', id);
                  const success = await removeFriend(id);
                  
                  if (success) {
                    console.log('Friend removed successfully');
                    setFriendshipStatus('none');
                    Alert.alert('Success', `${displayName} has been removed from your friends.`);
                    // Refresh friends list
                    await refetchFriends();
                  } else {
                    console.error('Failed to remove friend, no success returned');
                    Alert.alert('Error', 'Failed to remove friend. Please try again.');
                  }
                } catch (error) {
                  console.error('Error in unfriend action:', error);
                  Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                } finally {
                  setIsProcessingFriend(false);
                }
              },
            },
          ],
          { cancelable: false }
        );
        return;
      } else if (friendshipStatus === 'sent') {
        Alert.alert(
          'Cancel Request',
          `Are you sure you want to cancel your friend request to ${displayName}?`,
          [
            { text: 'No', style: 'cancel', onPress: () => setIsProcessingFriend(false) },
            {
              text: 'Yes, Cancel',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('Canceling friend request to ID:', id);
                  const success = await cancelFriendRequest(id);
                  
                  if (success) {
                    console.log('Friend request canceled successfully');
                    setFriendshipStatus('none');
                    Alert.alert('Success', `Friend request to ${displayName} has been canceled.`);
                    // Refresh friends list
                    await refetchFriends();
                  } else {
                    console.error('Failed to cancel friend request');
                    Alert.alert('Error', 'Failed to cancel friend request. Please try again.');
                  }
                } catch (error) {
                  console.error('Error in cancel request action:', error);
                  Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                } finally {
                  setIsProcessingFriend(false);
                }
              },
            },
          ],
          { cancelable: false }
        );
        return;
      }
    } catch (error) {
      console.error('Error handling friend action:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleShare = async () => {
    if (!userProfile) return;
    
    try {
      // In a real app, you'd implement proper sharing
      Alert.alert('Share Profile', `Share ${displayName}'s profile with others!`);
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  // Helper functions for territory calculations
  const calculateRealTerritoryFromWalkPoints = (walkPoints: any[]): number => {
    if (walkPoints.length < 3) return 0;

    const sessionGroups = walkPoints.reduce((groups, point) => {
      if (!groups[point.walk_session_id]) {
        groups[point.walk_session_id] = [];
      }
      groups[point.walk_session_id].push(point);
      return groups;
    }, {} as Record<string, any[]>);

    let totalTerritory = 0;

    Object.values(sessionGroups).forEach(sessionPoints => {
      if (sessionPoints.length >= 3) {
        sessionPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        let area = 0;
        const n = sessionPoints.length;
        
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const xi = sessionPoints[i].longitude;
          const yi = sessionPoints[i].latitude;
          const xj = sessionPoints[j].longitude;
          const yj = sessionPoints[j].latitude;
          
          area += (xi * yj - xj * yi);
        }
        
        area = Math.abs(area) / 2;
        
        const avgLat = sessionPoints.reduce((sum, p) => sum + p.latitude, 0) / sessionPoints.length;
        const latConversion = 111.32;
        const lonConversion = 111.32 * Math.cos(toRad(avgLat));
        
        const areaInKm2 = area * latConversion * lonConversion;
        
        if (areaInKm2 > 0.0001 && areaInKm2 < 10) {
          totalTerritory += areaInKm2;
        }
      }
    });

    return totalTerritory;
  };

  const calculateRealDistanceFromWalkPoints = (walkPoints: any[]): number => {
    if (walkPoints.length < 2) return 0;

    const sessionGroups = walkPoints.reduce((groups, point) => {
      if (!groups[point.walk_session_id]) {
        groups[point.walk_session_id] = [];
      }
      groups[point.walk_session_id].push(point);
      return groups;
    }, {} as Record<string, any[]>);

    let totalDistance = 0;

    Object.values(sessionGroups).forEach(sessionPoints => {
      if (sessionPoints.length > 1) {
        sessionPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        for (let i = 1; i < sessionPoints.length; i++) {
          const prev = sessionPoints[i - 1];
          const curr = sessionPoints[i];
          const distance = calculateDistance(
            prev.latitude,
            prev.longitude,
            curr.latitude,
            curr.longitude
          );
          
          if (distance > 0 && distance < 1) {
            totalDistance += distance;
          }
        }
      }
    });

    return totalDistance;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
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

  const getFriendButtonContent = () => {
    switch (friendshipStatus) {
      case 'friend':
        return {
          icon: <UserMinus size={20} color={COLORS.white} />,
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
          icon: <X size={20} color={COLORS.neutralDark} />,
          text: 'Cancel Request',
          style: [styles.actionButton, styles.cancelButton],
          disabled: false,
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'User';
  const isCurrentUserProfile = id === currentUser?.id;
  const friendButton = getFriendButtonContent();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Share2 size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <UserAvatar
              userId={userProfile.id}
              photoURL={userProfile.avatar_url}
              userName={displayName}
              size={100}
            />
          </View>
          
          <Text style={styles.userName}>{displayName}</Text>

          {/* Friend Action Button */}
          {!isCurrentUserProfile && (
            <TouchableOpacity 
              style={friendButton.style}
              onPress={handleFriendAction}
              disabled={friendButton.disabled || isProcessingFriend}
            >
              {isProcessingFriend ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                friendButton.icon
              )}
              <Text style={[
                styles.actionButtonText,
                friendButton.disabled && styles.disabledButtonText,
                friendshipStatus === 'sent' && styles.cancelButtonText
              ]}>
                {isProcessingFriend ? 'Processing...' : friendButton.text}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.emphasisStatCard]}>
              <Map size={24} color={COLORS.primary} />
              <Text style={[styles.statValue, styles.emphasisStatValue]}>
                {userStats.territorySize > 0 ? `${(userStats.territorySize * 1000000).toFixed(0)} m²` : '0 m²'}
              </Text>
              <Text style={[styles.statLabel, styles.emphasisStatLabel]}>Territory</Text>
            </View>
            <View style={styles.statCard}>
              <Award size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{userStats.achievementCount}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Route size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>
                {userStats.thisMonthDistance > 0 ? `${(userStats.thisMonthDistance * 1000).toFixed(0)} m` : '0 m'}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statCard}>
              <Route size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>
                {userStats.totalDistance > 0 ? `${(userStats.totalDistance * 1000).toFixed(0)} m` : '0 m'}
              </Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
          </View>
        </View>

        {/* Dogs Section */}
        {userDogs.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isCurrentUserProfile ? 'My Dogs' : `${displayName.split(' ')[0]}'s Dogs`}
              </Text>
              <View style={styles.dogCountBadge}>
                <Text style={styles.dogCountText}>
                  {userDogs.length} {userDogs.length === 1 ? 'dog' : 'dogs'}
                </Text>
              </View>
            </View>

            {/* Dog Avatars Row */}
            <View style={styles.dogAvatarsRow}>
              {userDogs.slice(0, 5).map((dog, index) => (
                <View 
                  key={dog.id} 
                  style={[
                    styles.userDogAvatarWrapper, 
                    { zIndex: 5 - index, left: index * 20 }
                  ]}
                >
                  <UserAvatar
                    userId={dog.id}
                    photoURL={dog.photo_url}
                    userName={dog.name}
                    size={70}
                    isDogAvatar={true}
                    dogBreed={dog.breed}
                  />
                </View>
              ))}
              
              {userDogs.length > 5 && (
                <View 
                  style={[
                    styles.userDogAvatarWrapper, 
                    styles.userMoreDogsBadge,
                    { zIndex: 0, left: 5 * 20 }
                  ]}
                >
                  <Text style={styles.userMoreDogsBadgeText}>+{userDogs.length - 5}</Text>
                </View>
              )}
            </View>

            {/* Dog Cards */}
            <View style={styles.dogCardsList}>
              {userDogs.map((dog) => (
                <View key={dog.id} style={styles.dogCardWrapper}>
                  <DogProfileCard 
                    dog={dog} 
                    showFullDetails={false}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Badges Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <Text style={styles.badgesCount}>
              {userBadges.length} earned
            </Text>
          </View>

          {userBadges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {userBadges.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <View style={styles.badgeImageContainer}>
                    <UserAvatar
                      userId={badge.id}
                      photoURL={badge.icon_url}
                      userName={badge.title}
                      size={60}
                      showFallback={false}
                    />
                  </View>
                  <Text style={styles.badgeTitle} numberOfLines={2}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeDate}>
                    {new Date(badge.obtained_at).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBadgesContainer}>
              <Award size={48} color={COLORS.neutralMedium} />
              <Text style={styles.emptyBadgesText}>No badges earned yet</Text>
            </View>
          )}
        </View>

        {/* Member Since */}
        <View style={styles.memberSinceContainer}>
          <Text style={styles.memberSinceText}>
            Member since {new Date(userProfile.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  shareButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
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
  cancelButton: {
    backgroundColor: COLORS.neutralLight,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  actionButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 8,
  },
  disabledButtonText: {
    color: COLORS.neutralDark,
  },
  cancelButtonText: {
    color: COLORS.error,
  },
  statsSection: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emphasisStatCard: {
    backgroundColor: COLORS.primaryExtraLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  emphasisStatValue: {
    color: COLORS.primary,
    fontSize: 20,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  emphasisStatLabel: {
    color: COLORS.primary,
    fontFamily: 'Inter-Medium',
  },
  sectionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
  },
  dogCountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  dogCountText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  dogAvatarsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    height: 70,
    marginLeft: 16,
  },
  userDogAvatarWrapper: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: COLORS.white,
    borderRadius: 35,
    width: 70,
    height: 70,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userMoreDogsBadge: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMoreDogsBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.white,
  },
  dogCardsList: {
    marginTop: 16,
  },
  dogCardWrapper: {
    marginBottom: 12,
  },
  badgesCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeImageContainer: {
    marginBottom: 8,
  },
  badgeTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  badgeDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: COLORS.neutralMedium,
  },
  emptyBadgesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyBadgesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  memberSinceContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  memberSinceText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
});