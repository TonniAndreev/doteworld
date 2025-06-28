import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Route, Clock, MapPin, Trophy, Award, Zap } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { PanGestureHandler } from 'react-native-gesture-handler';

type WalkStatsPanelProps = {
  walkDistance: number;
  walkDuration: number;
  pointsCount: number;
  territorySize: number;
  onClose: () => void;
};

export default function WalkStatsPanel({ 
  walkDistance, 
  walkDuration, 
  pointsCount,
  territorySize,
  onClose 
}: WalkStatsPanelProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDistance = (distance: number): string => {
    const meters = distance * 1000;
    if (meters >= 1000) {
      return `${distance.toFixed(2)} km`;
    } else {
      return `${meters.toFixed(0)} m`;
    }
  };

  const formatTerritory = (size: number): string => {
    const squareMeters = size * 1000000;
    if (squareMeters >= 10000) {
      return `${size.toFixed(2)} km²`;
    } else {
      return `${squareMeters.toFixed(0)} m²`;
    }
  };

  const calculatePace = (): string => {
    if (walkDistance <= 0 || walkDuration <= 0) return '-';
    
    // Calculate minutes per kilometer
    const paceInMinPerKm = (walkDuration / 60) / walkDistance;
    
    const paceMinutes = Math.floor(paceInMinPerKm);
    const paceSeconds = Math.floor((paceInMinPerKm - paceMinutes) * 60);
    
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} min/km`;
  };

  const calculateCalories = (): number => {
    // Simple estimation: ~60 calories per km walked
    return Math.round(walkDistance * 60);
  };

  const handleGesture = (event) => {
    const { translationY } = event.nativeEvent;
    if (translationY > 50) {
      onClose();
    }
  };

  return (
    <PanGestureHandler onGestureEvent={handleGesture}>
      <View style={styles.container}>
        <View style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
        </View>

        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Route size={24} color={COLORS.secondary} />
            <Text style={styles.title}>Current Walk Stats</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.neutralDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Clock size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{formatDuration(walkDuration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statCard}>
            <Route size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>{formatDistance(walkDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          
          <View style={styles.statCard}>
            <MapPin size={24} color={COLORS.tertiary} />
            <Text style={styles.statValue}>{pointsCount}</Text>
            <Text style={styles.statLabel}>GPS Points</Text>
          </View>
          
          <View style={styles.statCard}>
            <Trophy size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{formatTerritory(territorySize)}</Text>
            <Text style={styles.statLabel}>Territory</Text>
          </View>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.additionalStatRow}>
            <View style={styles.additionalStatItem}>
              <Zap size={20} color={COLORS.primary} />
              <View style={styles.additionalStatContent}>
                <Text style={styles.additionalStatLabel}>Pace</Text>
                <Text style={styles.additionalStatValue}>{calculatePace()}</Text>
              </View>
            </View>
            
            <View style={styles.additionalStatItem}>
              <Award size={20} color={COLORS.primary} />
              <View style={styles.additionalStatContent}>
                <Text style={styles.additionalStatLabel}>Calories</Text>
                <Text style={styles.additionalStatValue}>{calculateCalories()} cal</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Keep walking to conquer more territory and earn rewards!
          </Text>
        </View>
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  additionalStats: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  additionalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  additionalStatContent: {
    marginLeft: 8,
  },
  additionalStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  additionalStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  infoContainer: {
    backgroundColor: COLORS.primaryExtraLight,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    lineHeight: 20,
  },
});