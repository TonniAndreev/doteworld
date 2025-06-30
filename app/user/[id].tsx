import React, { useState, useEffect, useCallback } from 'react';
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
import { ChevronLeft, UserPlus, UserCheck, UserX, Award, Map, Route, Share2, UserMinus, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';
import UserAvatar from '@/components/common/UserAvatar';
import DogProfileCard from '@/components/profile/DogProfileCard';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { formatArea, formatDistance } from '@/utils/formatUtils';

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'friend' | 'pending' | 'sent'>('none');
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);
  
  const { friends, sendFriendRequest, removeFriend, cancelFriendRequest, refetch: refetchFriends } = useFriends();
  const { user: currentUser } = useAuth();

  // Check friendship status first, then load user data
  useEffect(() => {
    if (id && currentUser) {
      checkFriendshipStatus();
      loadUserData();
    }
  }, [id, currentUser]);

  // Re-check friendship status when friends list changes
  useEffect(() => {
    if (id && currentUser && friends) {
      checkFriendshipStatus();
    }
  }, [friends]);

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
    
    setIsLoadingProfile(true);
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

      // Get achievement count
      const { count: achievementCount } = await supabase
        .from('profile_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', id)
        .not('obtained_at', 'is', null);

      // Set initial stats with achievement count
      setUserStats(prev => ({
        ...prev,
        achievementCount: achievementCount || 0
      }));

      // Set loading state
      setIsLoadingProfile(false);
      
      // Load detailed stats in a separate operation
      loadUserStats(dogData?.map(pd => pd.dogs).filter(Boolean) || []);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user profile');
      router.back();
      setIsLoadingProfile(false);
    }
  };

  // Separate function to load user stats after profile is loaded
  const loadUserStats = async (dogs: UserDog[]) => {
    if (!id || dogs.length === 0) {
      setIsLoadingStats(false);
      return;
    }

    try {
      setIsLoadingStats(true);
      
      let territorySize = 0;
      let totalDistance = 0;
      let thisMonthDistance = 0;
      
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Process each dog's walk sessions
      for (const dog of dogs) {
        if (!dog || !dog.id) continue;
        
        // Get walk sessions for this dog
        const { data: walkSessions, error: sessionsError } = await supabase
          .from('walk_sessions')
          .select('territory_gained, distance, started_at')
          .eq('dog_id', dog.id)
          .eq('status', 'completed');

        if (sessionsError) {
          console.error(`Error fetching walk sessions for dog ${dog.id}:`, sessionsError);
          continue;
        }

        if (walkSessions && walkSessions.length > 0) {
          // Add to total territory and distance
          territorySize += walkSessions.reduce((sum, session) => sum + (session.territory_gained || 0), 0);
          totalDistance += walkSessions.reduce((sum, session) => sum + (session.distance || 0), 0);
          
          // Calculate this month's distance
          const thisMonthWalkSessions = walkSessions.filter(session => {
            if (!session.started_at) return false;
            const sessionDate = new Date(session.started_at);
            return sessionDate.getMonth() === currentMonth && 
                   sessionDate.getFullYear() === currentYear;
          });
          
          thisMonthDistance += thisMonthWalkSessions.reduce((sum, session) => sum + (session.distance || 0), 0);
        }
      }
      
      // Update stats
      setUserStats({
        territorySize,
        totalDistance,
        thisMonthDistance,
        achievementCount: userStats.achievementCount // Keep existing achievement count
      });
      
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoadingStats(false);
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
        setIsProcessingFriend(false);
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

  if (isLoadingProfile) {
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

  function getFriendButtonContent() {
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
  }

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
          
          {userDogs.length > 0 && (
            <View style={styles.dogInfoContainer}>
              <Text style={styles.dogName}>{userDogs[0].name}</Text>
              <Text style={styles.dogBreed}>{userDogs[0].breed}</Text>
            </View>
          )}

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
                {formatArea(userStats.territorySize * 1000000)}
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
                {formatDistance(userStats.thisMonthDistance * 1000)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statCard}>
              <Route size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>
                {formatDistance(userStats.totalDistance * 1000)}
              </Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
          </View>
          
          {isLoadingStats && (
            <View style={styles.statsLoadingOverlay}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.statsLoadingText}>Loading stats...</Text>
            </View>
          )}
        </View>

        {/* Dogs Section */}
        {userDogs.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isCurrentUserProfile ? 'My Dogs' : `${displayName.split(' ')[0]}'s Dogs`}
              </Text>
              <Text style={styles.dogsCount}>
                {userDogs.length} dog{userDogs.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {userDogs.map((dog) => (
              <View key={dog.id} style={styles.dogCardWrapper}>
                <DogProfileCard 
                  dog={dog} 
                  showFullDetails={false}
                />
              </View>
            ))}
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
  dogInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dogName: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 4,
  },
  dogBreed: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
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
    position: 'relative',
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
  statsLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  statsLoadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 8,
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
  dogsCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
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