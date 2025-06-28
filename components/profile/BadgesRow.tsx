import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Award } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';

export default function BadgesRow() {
  const { achievements: badges } = useAchievements();
  const recentBadges = badges.slice(0, 3);

  if (recentBadges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Award size={32} color={COLORS.neutralMedium} />
        <Text style={styles.emptyText}>No badges yet</Text>
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)/achievements')}
        >
          <Text style={styles.exploreButtonText}>Explore Badges</Text>
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
      {recentBadges.map((badge) => (
        <TouchableOpacity
          key={badge.id}
          style={styles.badgeCard}
          onPress={() => router.push('/(tabs)/achievements')}
        >
          <Image 
            source={{ uri: badge.icon_url }}
            style={styles.badgeImage}
          />
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeTitle} numberOfLines={1}>
              {badge.title}
            </Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {badge.completed ? 'Earned!' : 'In Progress'}
              </Text>
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
  badgeCard: {
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
  badgeImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  statusContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
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