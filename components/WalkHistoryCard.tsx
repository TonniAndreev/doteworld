import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Route, Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

interface WalkHistoryCardProps {
  walk: {
    id: string;
    date: string;
    time: string;
    distance: string;
    territory: string;
    duration: string;
  };
  onPress?: () => void;
}

export default function WalkHistoryCard({ walk, onPress }: WalkHistoryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.date}>{walk.date}</Text>
        <Text style={styles.time}>{walk.time}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Route size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{walk.distance}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{walk.territory}</Text>
          <Text style={styles.statLabel}>Territory</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Clock size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{walk.duration}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  date: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.dark,
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray600,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.dark,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.gray600,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray300,
    marginHorizontal: 8,
  },
});