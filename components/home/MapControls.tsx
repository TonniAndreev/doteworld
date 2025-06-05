import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, Trophy, MapPin } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface MapControlsProps {
  isWalking: boolean;
  walkDistance: number;
  onToggleWalking: () => void;
  onToggleChallenges: () => void;
}

export default function MapControls({
  isWalking,
  walkDistance,
  onToggleWalking,
  onToggleChallenges,
}: MapControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.distanceContainer}>
        <MapPin size={20} color={COLORS.primary} />
        <Text style={styles.distanceText}>
          {walkDistance.toFixed(2)} km
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.walkButton, isWalking && styles.activeButton]}
          onPress={onToggleWalking}
        >
          {isWalking ? (
            <Pause size={24} color={COLORS.white} />
          ) : (
            <Play size={24} color={COLORS.white} />
          )}
          <Text style={styles.buttonText}>
            {isWalking ? 'End Walk' : 'Start Walk'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.challengesButton]}
          onPress={onToggleChallenges}
        >
          <Trophy size={24} color={COLORS.primary} />
          <Text style={styles.challengesButtonText}>Challenges</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walkButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
  },
  activeButton: {
    backgroundColor: COLORS.error,
  },
  challengesButton: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  buttonText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  challengesButtonText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
});