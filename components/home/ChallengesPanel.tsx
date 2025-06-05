import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Award, ChevronRight, GripHorizontal } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

type ChallengePanelProps = {
  walkDistance: number;
  onClose: () => void;
};

export default function ChallengesPanel({ walkDistance, onClose }: ChallengePanelProps) {
  // Mock challenges data - in a real app this would come from a backend
  const challenges = [
    {
      id: '1',
      title: 'Morning Explorer',
      description: 'Walk 1km before 9am',
      progress: walkDistance,
      target: 1000,
      reward: 50,
      timeLeft: '2h 30m',
    },
    {
      id: '2',
      title: 'Weekend Warrior',
      description: 'Complete 3 walks this weekend',
      progress: 2,
      target: 3,
      reward: 100,
      timeLeft: '1d 12h',
    },
    {
      id: '3',
      title: 'Territory Master',
      description: 'Claim 5 new territories',
      progress: 3,
      target: 5,
      reward: 150,
      timeLeft: '4h 15m',
    },
  ];

  const handleGesture = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationY > 50) {
        onClose();
      }
    }
  };

  return (
    <View style={styles.container}>
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View style={styles.dragHandle}>
          <GripHorizontal size={20} color={COLORS.neutralMedium} />
        </View>
      </PanGestureHandler>

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Award size={24} color={COLORS.primary} />
          <Text style={styles.title}>Active Challenges</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.challengesContainer}
      >
        {challenges.map((challenge) => (
          <TouchableOpacity key={challenge.id} style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.rewardText}>{challenge.reward} Paws</Text>
            </View>

            <Text style={styles.challengeDescription}>{challenge.description}</Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {challenge.progress}/{challenge.target}
              </Text>
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{challenge.timeLeft} left</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
  challengesContainer: {
    paddingLeft: 16,
    paddingRight: 32,
  },
  challengeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 280,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  rewardText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  challengeDescription: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  timeContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 12,
    color: COLORS.primary,
  },
});