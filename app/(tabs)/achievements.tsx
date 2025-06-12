import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Star } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

const mockAchievements = [
  { id: '1', title: 'Early Bird', description: 'Walk before 8 AM', completed: true },
  { id: '2', title: 'Marathon Walker', description: 'Walk 42 km total', completed: true },
  { id: '3', title: 'Social Butterfly', description: 'Make 5 friends', completed: false },
  { id: '4', title: 'Territory King', description: 'Claim 10 km²', completed: false },
];

export default function AchievementsScreen() {
  const renderItem = ({ item }) => (
    <View style={[styles.achievementItem, item.completed && styles.completedItem]}>
      <View style={styles.iconContainer}>
        {item.completed ? (
          <Star size={24} color={COLORS.gold} />
        ) : (
          <Award size={24} color={COLORS.neutralMedium} />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.descriptionText}>{item.description}</Text>
      </View>
      {item.completed && (
        <Text style={styles.completedText}>✓</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Award size={32} color={COLORS.primary} />
        <Text style={styles.title}>Achievements</Text>
      </View>

      <FlatList
        data={mockAchievements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
    marginLeft: 12,
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completedItem: {
    backgroundColor: COLORS.primaryLight,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  descriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  completedText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.success,
  },
});