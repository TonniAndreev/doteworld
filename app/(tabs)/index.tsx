import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Trophy, Users, Award } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>
          {user?.displayName || 'Dog Walker'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MapPin size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>2.5 km²</Text>
            <Text style={styles.statLabel}>Territory</Text>
          </View>
          
          <View style={styles.statCard}>
            <Trophy size={32} color={COLORS.secondary} />
            <Text style={styles.statValue}>15</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Award size={32} color={COLORS.accent} />
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          
          <View style={styles.statCard}>
            <Users size={32} color={COLORS.success} />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startWalkButton}>
          <Text style={styles.startWalkText}>Start Walking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  startWalkButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 32,
  },
  startWalkText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.white,
  },
});