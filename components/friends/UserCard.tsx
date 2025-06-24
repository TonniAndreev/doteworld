import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserCheck } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import UserAvatar from '@/components/common/UserAvatar';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    dogName: string;
    dogBreed: string;
    photoURL?: string | null;
    territorySize: number;
    achievementCount: number;
  };
  onPress: () => void;
  isFriend: boolean;
}

export default function UserCard({ user, onPress, isFriend }: UserCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
          {user.dogName} • {user.dogBreed}
        </Text>
        
        <View style={styles.stats}>
          <Text style={styles.stat}>{user.territorySize} km² territory</Text>
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
    marginRight: 12,
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
  },
  stat: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralDark,
  },
  statDivider: {
    marginHorizontal: 6,
    color: COLORS.neutralMedium,
  },
});