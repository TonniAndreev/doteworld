import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Crown } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

const mockLeaderboard = [
  { id: '1', name: 'Sarah Miller', score: '15.2 km²', rank: 1 },
  { id: '2', name: 'John Walker', score: '12.8 km²', rank: 2 },
  { id: '3', name: 'Emma Davis', score: '10.5 km²', rank: 3 },
  { id: '4', name: 'Mike Chen', score: '8.9 km²', rank: 4 },
  { id: '5', name: 'Lisa Park', score: '7.2 km²', rank: 5 },
];

export default function LeaderboardScreen() {
  const renderItem = ({ item }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        {item.rank === 1 && <Crown size={20} color={COLORS.gold} />}
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <Text style={styles.nameText}>{item.name}</Text>
      <Text style={styles.scoreText}>{item.score}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Trophy size={32} color={COLORS.primary} />
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      <FlatList
        data={mockLeaderboard}
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
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  rankText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  nameText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 16,
  },
  scoreText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
});