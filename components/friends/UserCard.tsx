import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import UserAvatar from '@/components/common/UserAvatar';

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
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <UserAvatar
        userId={user.id}
        photoURL={user.photoURL}
        userName={user.name}
        size={50}
        style={styles.avatar}
      />
      
      <View style={styles.info}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{user.name}</Text>
          {isFriend && <UserCheck size={16} color={COLORS.primary} style={styles.friendIcon} />}
        </View>
        
        <Text style={styles.dogInfo}>
          {user.dogName}{user.dogBreed ? ` • ${user.dogBreed}` : ''}
        </Text>
        
        <View style={styles.stats}>
          <Text style={styles.stat}>
            {user.territorySize > 0 ? `${(user.territorySize * 1000000).toFixed(0)} m²` : '0 m²'} territory
          </Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.stat}>
            {user.totalDistance > 0 ? `${(user.totalDistance * 1000).toFixed(0)} m` : '0 m'} walked
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
  avatar: {
    marginRight: 16,
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