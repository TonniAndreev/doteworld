import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import UserAvatar from '@/components/common/UserAvatar';
import { formatTerritorySize, formatDistance } from '@/utils/formatUtils';

type LeaderboardItemProps = {
  rank: number;
  user: {
    id: string;
    name: string;
    dogName: string;
    photoURL?: string | null;
    territorySize?: number;
    totalDistance?: number;
    achievementCount?: number;
  };
  category: 'territory' | 'distance' | 'achievements';
  isCurrentUser?: boolean;
  onPress?: () => void;
};

export default function LeaderboardItem({ 
  rank, 
  user, 
  category, 
  isCurrentUser = false,
  onPress 
}: LeaderboardItemProps) {
  const getValue = () => {
    switch (category) {
      case 'territory':
        return formatTerritorySize(user.territorySize || 0);
      case 'distance':
        return formatDistance(user.totalDistance || 0);
      case 'achievements':
        return user.achievementCount || 0;
      default:
        return '';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate directly to the public profile page
      router.push(`/user/${user.id}`);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isCurrentUser && styles.highlightedContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.rankContainer,
        isCurrentUser && styles.highlightedRankContainer
      ]}>
        <Text style={[
          styles.rankText,
          isCurrentUser && styles.highlightedRankText
        ]}>{rank}</Text>
      </View>
      
      <UserAvatar
        userId={user.id}
        photoURL={user.photoURL}
        userName={user.name}
        size={40}
        style={[
          styles.avatar,
          isCurrentUser && styles.highlightedAvatar
        ]}
      />
      
      <View style={styles.userInfo}>
        <Text style={[
          styles.userName,
          isCurrentUser && styles.highlightedUserName
        ]}>{user.name}</Text>
        <Text style={[
          styles.dogName,
          isCurrentUser && styles.highlightedDogName
        ]}>{user.dogName}</Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[
          styles.scoreText,
          isCurrentUser && styles.highlightedScoreText,
          category === 'territory' && styles.territoryScoreText
        ]}>{getValue()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightedContainer: {
    backgroundColor: COLORS.primaryExtraLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  highlightedRankContainer: {
    backgroundColor: COLORS.primary,
  },
  rankText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  highlightedRankText: {
    color: COLORS.white,
  },
  avatar: {
    marginRight: 16,
  },
  highlightedAvatar: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  highlightedUserName: {
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  dogName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  highlightedDogName: {
    color: COLORS.primary,
    fontFamily: 'Inter-Medium',
  },
  scoreContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  territoryScoreText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  highlightedScoreText: {
    color: COLORS.primary,
    fontSize: 18,
  },
});