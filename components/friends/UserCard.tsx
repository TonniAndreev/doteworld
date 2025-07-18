import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import UserAvatar from '@/components/common/UserAvatar';
import { formatArea, formatDistance } from '@/utils/formatUtils';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    dogName: string;
    dogBreed?: string;
    photoURL?: string | null;
    territorySize: number;
    totalDistance: number;
    achievementCount: number;
    dogs?: Array<{
      id: string;
      name: string;
      breed?: string;
      photo_url?: string | null;
    }>;
  };
  onPress?: () => void;
  isFriend: boolean;
}

export default function UserCard({ user, onPress, isFriend }: UserCardProps) {
  const handlePress = () => {
    console.log('UserCard: Card pressed for user:', user.name, user.id);
    // Navigate directly to the public profile page
    router.push(`/user/${user.id}`);
  };

  // Determine if we have dogs and how many
  const hasDogs = user.dogs && user.dogs.length > 0;
  const dogCount = user.dogs?.length || 0;
  
  // Format dog names as comma-separated list
  const getDogNames = () => {
    if (!hasDogs) return user.dogName || 'No dog';
    
    const names = user.dogs.map(dog => dog.name);
    return names.join(', ');
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        <UserAvatar
          userId={user.id}
          photoURL={user.photoURL}
          userName={user.name}
          size={50}
          style={styles.userAvatar}
        />
        
        {/* Dog avatars - different display based on number of dogs */}
        {hasDogs && (
          <View style={styles.dogAvatarsContainer}>
            {/* First dog avatar - always shown if there's at least one dog */}
            {dogCount >= 1 && (
              <View style={styles.dogAvatarWrapper}>
                <UserAvatar
                  userId={`dog-${user.dogs[0].id}`}
                  photoURL={user.dogs[0].photo_url}
                  userName={user.dogs[0].name}
                  size={23}
                  isDogAvatar={true}
                  dogBreed={user.dogs[0].breed}
                  style={styles.dogAvatar}
                />
              </View>
            )}
            
            {/* Second dog avatar - shown if there are at least 2 dogs */}
            {dogCount >= 2 && (
              <View style={styles.dogAvatarWrapper}>
                <UserAvatar
                  userId={`dog-${user.dogs[1].id}`}
                  photoURL={user.dogs[1].photo_url}
                  userName={user.dogs[1].name}
                  size={23}
                  isDogAvatar={true}
                  dogBreed={user.dogs[1].breed}
                  style={styles.dogAvatar}
                />
              </View>
            )}
            
            {/* "+X" indicator for 3 or more dogs */}
            {dogCount > 2 && (
              <View style={styles.dogAvatarWrapper}>
                <View style={styles.moreDogsBadge}>
                  <Text style={styles.moreDogsBadgeText}>+{dogCount - 2}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{user.name}</Text>
          {isFriend && <UserCheck size={16} color={COLORS.primary} style={styles.friendIcon} />}
        </View>
        
        <Text style={styles.dogInfo} numberOfLines={1}>
          {getDogNames()}
        </Text>
        
        <View style={styles.stats}>
          <Text style={styles.stat}>
            {formatArea(user.territorySize * 1000000)} territory
          </Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.stat}>
            {formatDistance(user.totalDistance * 1000)} walked
          </Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.stat}>{user.achievementCount} badges</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
    width: 50,
    height: 50,
  },
  userAvatar: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  dogAvatarsContainer: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    flexDirection: 'row',
  },
  dogAvatarWrapper: {
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 11.5,
    overflow: 'hidden',
    marginRight: -10, // Negative margin for overlapping effect
  },
  dogAvatar: {
    borderRadius: 11.5,
  },
  moreDogsBadge: {
    width: 23,
    height: 23,
    borderRadius: 11.5,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreDogsBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: COLORS.white,
  },
  info: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginRight: 4,
  },
  friendIcon: {
    marginLeft: 4,
  },
  dogInfo: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stat: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralDark,
  },
  statDivider: {
    marginHorizontal: 4,
    color: COLORS.neutralMedium,
    fontSize: 12,
  },
});