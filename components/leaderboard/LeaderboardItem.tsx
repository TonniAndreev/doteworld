import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

type LeaderboardItemProps = {
  rank: number;
  user: {
    name: string;
    dogName: string;
    territorySize?: number;
    totalDistance?: number;
    achievementCount?: number;
    pawsBalance?: number;
  };
  category: 'territory' | 'distance' | 'achievements' | 'paws';
};

export default function LeaderboardItem({ rank, user, category }: LeaderboardItemProps) {
  const getValue = () => {
    switch (category) {
      case 'territory':
        return `${user.territorySize} km²`;
      case 'distance':
        return `${user.totalDistance} km`;
      case 'achievements':
        return user.achievementCount;
      case 'paws':
        return user.pawsBalance;
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.dogName}>{user.dogName}</Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{getValue()}</Text>
      </View>
    </View>
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
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  dogName: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  scoreContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
});