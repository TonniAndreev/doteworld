import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Award, Users, Map, Route, LogOut, Pencil } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTerritory } from '@/contexts/TerritoryContext';
import StatsCard from '@/components/profile/StatsCard';
import BadgesRow from '@/components/profile/BadgesRow';
import NotificationsButton from '@/components/common/NotificationsButton';
import DogOwnershipInvites from '@/components/dog/DogOwnershipInvites';
import UserAvatar from '@/components/common/UserAvatar';
import { formatArea, formatDistance } from '@/utils/formatUtils';

export default function ProfileScreen() {
  const [showInvites, setShowInvites] = useState(false);
  const [thisMonthDistance, setThisMonthDistance] = useState(0);
  
  const { user, logout } = useAuth();
  const { territorySize, totalDistance } = useTerritory();

  useEffect(() => {
    // Calculate this month's distance (for now, we'll use 30% of total as a placeholder)
    // In a real implementation, you would filter walk data by current month
    if (user) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Simulate monthly distance (30% of total)
      // In a real app, you would query the database for walks in the current month
      setThisMonthDistance(totalDistance * 0.3);
    }
  }, [user, totalDistance]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const firstDog = user.dogs?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Pencil size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <NotificationsButton />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <UserAvatar
              userId={user.id}
              photoURL={user.avatar_url}
              userName={user.displayName || 'User'}
              size={100}
              containerStyle={styles.avatarContainer}
            />
          </View>
          
          <Text style={styles.userName}>{user.displayName || 'User'}</Text>
          
          <View style={styles.dogInfoContainer}>
            <Text style={styles.dogName}>{firstDog?.name || 'No dog'}</Text>
            <Text style={styles.dogBreed}>{firstDog?.breed || ''}</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatsCard
              icon={<Map size={24} color={COLORS.primary} />}
              value={formatArea(territorySize * 1000000)}
              label="Territory"
              emphasis={true}
            />
            <StatsCard
              icon={<Award size={24} color={COLORS.primary} />}
              value={(user.badgeCount || 0).toString()}
              label="Badges"
            />
          </View>
          
          <View style={styles.statsRow}>
            <StatsCard
              icon={<Route size={24} color={COLORS.primary} />}
              value={formatDistance(thisMonthDistance * 1000)}
              label="This Month"
            />
            <StatsCard
              icon={<Route size={24} color={COLORS.primary} />}
              value={formatDistance(totalDistance * 1000)}
              label="Total Distance"
            />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Dogs</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/dog-profile')}
            >
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dogPreviewContainer}>
            {firstDog ? (
              <TouchableOpacity 
                style={styles.dogPreviewCard}
                onPress={() => router.push('/(tabs)/dog-profile')}
              >
                <UserAvatar
                  userId={firstDog.id}
                  photoURL={firstDog.photo_url}
                  userName={firstDog.name}
                  size={60}
                  isDogAvatar={true}
                  dogBreed={firstDog.breed}
                  containerStyle={styles.dogAvatarContainer}
                />
                <View style={styles.dogPreviewInfo}>
                  <Text style={styles.dogPreviewName}>{firstDog.name}</Text>
                  <Text style={styles.dogPreviewBreed}>{firstDog.breed}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.addDogCard}
                onPress={() => router.push('/(auth)/dog-profile')}
              >
                <Text style={styles.addDogText}>Add your first dog</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/achievements')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <BadgesRow />
        </View>

        {/* Dog Ownership Invites Section */}
        <View style={styles.sectionContainer}>
          <DogOwnershipInvites 
            onInviteHandled={() => {
              // Refresh user data when invites are handled
              // This will update the dogs list
            }}
          />
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/friends')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.friendsPreviewContainer}>
            {user.friends && user.friends.length > 0 ? (
              <View style={styles.friendsList}>
                {user.friends.slice(0, 3).map((friend: any) => (
                  <View key={friend.id} style={styles.friendItem}>
                    <UserAvatar
                      userId={friend.id}
                      photoURL={friend.photoURL}
                      userName={friend.name}
                      size={60}
                      containerStyle={styles.friendAvatarContainer}
                    />
                    <Text style={styles.friendName} numberOfLines={1}>
                      {friend.name || 'Friend'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noFriendsText}>Add friends to see them here</Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
    marginHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  avatarContainer: {
    backgroundColor: '#F0F0F0',
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  dogInfoContainer: {
    alignItems: 'center',
  },
  dogName: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: COLORS.primary,
  },
  dogBreed: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  statsSection: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  dogPreviewContainer: {
    paddingVertical: 8,
  },
  dogPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralExtraLight,
    padding: 16,
    borderRadius: 12,
  },
  dogAvatarContainer: {
    backgroundColor: '#F0F0F0',
  },
  dogPreviewInfo: {
    marginLeft: 16,
    flex: 1,
  },
  dogPreviewName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  dogPreviewBreed: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  addDogCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addDogText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.primary,
  },
  friendsPreviewContainer: {
    paddingVertical: 8,
  },
  friendsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  friendItem: {
    alignItems: 'center',
    width: 80,
  },
  friendAvatarContainer: {
    backgroundColor: '#F0F0F0',
  },
  friendName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginTop: 8,
  },
  noFriendsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    paddingVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 8,
  },
});