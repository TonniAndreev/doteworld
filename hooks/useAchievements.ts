import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon_url: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  unit: string;
  pawsReward: number;
  obtained_at?: string;
}

interface AchievementProgress {
  [key: string]: {
    currentValue: number;
    lastChecked: string;
  };
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyCompletedBadge, setNewlyCompletedBadge] = useState<Achievement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        return;
      }

      // Fetch user's completed achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('profile_achievements')
        .select('achievement_id, obtained_at')
        .eq('profile_id', user.id);

      if (userAchievementsError) {
        console.error('Error fetching user achievements:', userAchievementsError);
      }

      const completedAchievementIds = new Set(
        userAchievements?.map(ua => ua.achievement_id) || []
      );

      // Get stored progress from AsyncStorage
      const storedProgressString = await AsyncStorage.getItem(`achievement_progress_${user.id}`);
      const storedProgress: AchievementProgress = storedProgressString 
        ? JSON.parse(storedProgressString) 
        : {};

      // Combine achievements with completion status and progress
      const achievementsWithStatus: Achievement[] = allAchievements?.map(achievement => {
        const isCompleted = completedAchievementIds.has(achievement.id);
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        const progress = storedProgress[achievement.key] || { currentValue: 0, lastChecked: new Date().toISOString() };
        
        // For completed achievements, ensure currentValue matches targetValue
        const currentValue = isCompleted ? 1 : progress.currentValue;

        return {
          id: achievement.id,
          key: achievement.key,
          title: achievement.title,
          description: achievement.description || '',
          icon_url: achievement.icon_url || 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300',
          completed: isCompleted,
          currentValue: currentValue,
          targetValue: 1, // This would come from achievement definition
          unit: 'completion',
          pawsReward: 5, // Default reward amount
          obtained_at: userAchievement?.obtained_at,
        };
      }) || [];

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAchievements = async () => {
    if (!user) return null;

    try {
      // Get current progress
      const storedProgressString = await AsyncStorage.getItem(`achievement_progress_${user.id}`);
      const storedProgress: AchievementProgress = storedProgressString 
        ? JSON.parse(storedProgressString) 
        : {};
      
      let updatedProgress = { ...storedProgress };
      let newlyCompleted: Achievement | null = null;
      
      // Check for "First Steps" achievement
      const firstStepsAchievement = achievements.find(a => a.key === 'first_steps');
      if (firstStepsAchievement && !firstStepsAchievement.completed) {
        // Check if user has any walk sessions
        const { count } = await supabase
          .from('walk_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        if (count && count > 0) {
          // User has completed walks, award the achievement
          const result = await unlockAchievement('first_steps');
          if (result) {
            newlyCompleted = { ...firstStepsAchievement, completed: true, currentValue: 1 };
          }
        }
      }
      
      // Check for "Social Butterfly" achievement
      const socialButterflyAchievement = achievements.find(a => a.key === 'social_butterfly');
      if (socialButterflyAchievement && !socialButterflyAchievement.completed) {
        // Check if user has any friends
        const { count } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        if (count && count >= 3) {
          // User has at least 3 friends, award the achievement
          const result = await unlockAchievement('social_butterfly');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...socialButterflyAchievement, completed: true, currentValue: 1 };
          }
        } else if (count) {
          // Update progress
          updatedProgress['social_butterfly'] = {
            currentValue: count / 3, // 3 friends needed
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Check for "Territory King" achievement
      const territoryKingAchievement = achievements.find(a => a.key === 'territory_king');
      if (territoryKingAchievement && !territoryKingAchievement.completed) {
        // Get user's total territory
        const { data: walkSessions } = await supabase
          .from('walk_sessions')
          .select('territory_gained')
          .eq('status', 'completed');
        
        const totalTerritory = walkSessions?.reduce((sum, session) => sum + (session.territory_gained || 0), 0) || 0;
        
        if (totalTerritory >= 0.1) { // 0.1 km² = 100,000 m²
          // User has conquered enough territory, award the achievement
          const result = await unlockAchievement('territory_king');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...territoryKingAchievement, completed: true, currentValue: 1 };
          }
        } else if (totalTerritory > 0) {
          // Update progress
          updatedProgress['territory_king'] = {
            currentValue: totalTerritory / 0.1,
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Save updated progress
      if (JSON.stringify(updatedProgress) !== JSON.stringify(storedProgress)) {
        await AsyncStorage.setItem(`achievement_progress_${user.id}`, JSON.stringify(updatedProgress));
      }
      
      // If any achievement was newly completed, refresh the achievements list
      if (newlyCompleted) {
        await fetchAchievements();
        setNewlyCompletedBadge(newlyCompleted);
        return newlyCompleted;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return null;
    }
  };

  const unlockAchievement = async (achievementKey: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Find achievement by key
      const { data: achievement, error: findError } = await supabase
        .from('achievements')
        .select('id')
        .eq('key', achievementKey)
        .single();

      if (findError || !achievement) {
        console.error('Achievement not found:', achievementKey);
        return false;
      }

      // Check if user already has this achievement
      const { data: existing, error: checkError } = await supabase
        .from('profile_achievements')
        .select('id')
        .eq('profile_id', user.id)
        .eq('achievement_id', achievement.id)
        .single();

      if (existing) {
        console.log('User already has this achievement');
        return false;
      }

      // Award achievement to user - use upsert to avoid race conditions
      const { error: insertError } = await supabase
        .from('profile_achievements')
        .upsert({
          profile_id: user.id,
          achievement_id: achievement.id,
          obtained_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id,achievement_id',
          ignoreDuplicates: true
        });

      if (insertError) {
        console.error('Error awarding achievement:', insertError);
        return false;
      }

      console.log(`Achievement ${achievementKey} unlocked successfully!`);
      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  };

  const clearNewlyCompletedBadge = () => {
    setNewlyCompletedBadge(null);
  };

  return {
    achievements,
    isLoading,
    unlockAchievement,
    checkAchievements,
    newlyCompletedBadge,
    clearNewlyCompletedBadge,
    refetch: fetchAchievements,
  };
}