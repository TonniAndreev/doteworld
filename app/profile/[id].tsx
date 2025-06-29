import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Route, Award, UserPlus, UserCheck, UserMinus } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isPendingRequest, setIsPendingRequest] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch user data from an API
    const mockUser = {
      id,
      name: 'Sarah Johnson',
      username: '@sarahjohnson',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
      stats: {
        territory: '24,500 m²',
        distance: '42.3 km',
        walks: 28,
      },
      dogs: [
        {
          id: '1',
          name: 'Max',
          breed: 'Golden Retriever',
          avatar: 'https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=150',
        },
      ],
      achievements: [
        {
          id: '1',
          name: 'Early Bird',
          icon: <Award size={24} color={COLORS.accent} />,
        },
        {
          id: '2',
          name: 'Marathon',
          icon: <Route size={24} color={COLORS.secondary} />,
        },
        {
          id: '3',
          name: 'Conqueror',
          icon: <MapPin size={24} color={COLORS.primary} />,
        },
      ],
    };

    setUser(mockUser);
    setIsLoading(false);
    
    // Check if this user is already a friend
    if (id === '1') {
      setIsFriend(true);
    } else if (id === '3') {
      setIsPendingRequest(true);
    }
  }, [id]);

  const handleFriendAction = () => {
    if (isFriend) {
      // Remove friend
      setIsFriend(false);
    } else if (isPendingRequest) {
      // Cancel request
      setIsPendingRequest(false);
    } else {
      // Send friend request
      setIsPendingRequest(true);
    }
  };

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Image source={{ uri: user.avatar }} style={styles.profileImage} />
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileUsername}>{user.username}</Text>
          
          <TouchableOpacity 
            style={[
              styles.friendButton,
              isFriend ? styles.unfriendButton : 
              isPendingRequest ? styles.pendingButton : 
              styles.addFriendButton
            ]}
            onPress={handleFriendAction}
          >
            {isFriend ? (
              <>
                <UserMinus size={20} color={COLORS.white} />
                <Text style={styles.friendButtonText}>Unfriend</Text>
              </>
            ) : isPendingRequest ? (
              <>
                <UserCheck size={20} color={COLORS.gray700} />
                <Text style={styles.pendingButtonText}>Request Sent</Text>
              </>
            ) : (
              <>
                <UserPlus size={20} color={COLORS.white} />
                <Text style={styles.friendButtonText}>Add Friend</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <MapPin size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{user.stats.territory}</Text>
            <Text style={styles.statLabel}>Territory</Text>
          </View>
          
          <View style={styles.statCard}>
            <Route size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{user.stats.distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Award size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{user.stats.walks}</Text>
            <Text style={styles.statLabel}>Walks</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dogs</Text>
          
          <View style={styles.dogsContainer}>
            {user.dogs.map((dog: any) => (
              <View key={dog.id} style={styles.dogCard}>
                <Image source={{ uri: dog.avatar }} style={styles.dogImage} />
                <Text style={styles.dogName}>{dog.name}</Text>
                <Text style={styles.dogBreed}>{dog.breed}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          
          <View style={styles.achievementsContainer}>
            {user.achievements.map((achievement: any) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <View style={styles.achievementIconContainer}>
                  {achievement.icon}
                </View>
                <Text style={styles.achievementName}>{achievement.name}</Text>
              </View>
            ))}
          </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.dark,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.dark,
    marginBottom: 4,
  },
  profileUsername: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.gray600,
    marginBottom: 16,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addFriendButton: {
    backgroundColor: COLORS.primary,
  },
  unfriendButton: {
    backgroundColor: COLORS.error,
  },
  pendingButton: {
    backgroundColor: COLORS.gray200,
  },
  friendButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 8,
  },
  pendingButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.gray700,
    marginLeft: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.dark,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.gray600,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.dark,
    marginBottom: 16,
  },
  dogsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dogCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginRight: '4%',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dogCard2: {
    marginRight: 0,
  },
  dogImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  dogName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
  },
  dogBreed: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray600,
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.dark,
    textAlign: 'center',
  },
});