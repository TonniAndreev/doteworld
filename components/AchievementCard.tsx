import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/Colors';

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    progress?: number;
    completed?: boolean;
  };
  onPress?: () => void;
}

export default function AchievementCard({ achievement, onPress }: AchievementCardProps) {
  const isCompleted = achievement.completed || (achievement.progress && achievement.progress >= 1);
  
  return (
    <TouchableOpacity 
      style={[styles.card, isCompleted && styles.completedCard]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, isCompleted && styles.completedIconContainer]}>
        {achievement.icon}
      </View>
      
      <Text style={[styles.name, isCompleted && styles.completedText]}>
        {achievement.name}
      </Text>
      
      <Text style={styles.description} numberOfLines={2}>
        {achievement.description}
      </Text>
      
      {achievement.progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(100, achievement.progress * 100)}%` },
                isCompleted && styles.completedProgressFill
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {isCompleted ? 'Completed!' : `${Math.floor(achievement.progress * 100)}%`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  completedCard: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completedIconContainer: {
    backgroundColor: COLORS.primaryLight,
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
  },
  completedText: {
    color: COLORS.primary,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gray500,
    borderRadius: 3,
  },
  completedProgressFill: {
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.gray600,
    textAlign: 'right',
  },
});