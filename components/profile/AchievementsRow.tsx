import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Award } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';

export default function AchievementsRow() {
  const { achievements } = useAchievements();
  const recentAchievements = achievements.slice(0, 3);

  if (recentAchievements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Award size={32} color={COLORS.neutralMedium} />
        <Text style={styles.emptyText}>No achievements yet</Text>
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)/achievements')}
        >
          <Text style={styles.exploreButtonText}>Explore Achievements</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {recentAchievements.map((achievement) => (
        <TouchableOpacity
          key={achievement.id}
          style={styles.achievementCard}
          onPress={() => router.push('/(tabs)/achievements')}
        >
          <Image 
            source={{ uri: achievement.imageUrl }}
            style={styles.achievementImage}
          />
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle} numberOfLines={1}>
              {achievement.title}
            </Text>
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardText}>{achievement.pawsReward} Paws</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  achievementCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 140,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  rewardContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rewardText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginTop: 8,
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
});