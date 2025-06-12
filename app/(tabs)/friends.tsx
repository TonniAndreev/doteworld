import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, User } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

const mockFriends = [
  { id: '1', name: 'Sarah Miller', dogName: 'Luna' },
  { id: '2', name: 'John Walker', dogName: 'Max' },
  { id: '3', name: 'Emma Davis', dogName: 'Bella' },
  { id: '4', name: 'Mike Chen', dogName: 'Rocky' },
];

export default function FriendsScreen() {
  const renderItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.avatarContainer}>
        <User size={24} color={COLORS.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
        <Text style={styles.dogText}>with {item.dogName}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Users size={32} color={COLORS.primary} />
        <Text style={styles.title}>Friends</Text>
      </View>

      <FlatList
        data={mockFriends}
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
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  dogText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
});