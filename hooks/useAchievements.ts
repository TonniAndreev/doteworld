import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

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
  obtained_at?: string;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

      // Combine achievements with completion status
      const achievementsWithStatus: Achievement[] = allAchievements?.map(achievement => {
        const isCompleted = completedAchievementIds.has(achievement.id);
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);

        return {
          id: achievement.id,
          key: achievement.key,
          title: achievement.title,
          description: achievement.description || '',
          icon_url: achievement.icon_url || 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300',
          completed: isCompleted,
          currentValue: isCompleted ? 1 : 0, // This would be calculated based on user's actual progress
          targetValue: 1, // This would come from achievement definition
          unit: 'completion',
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

  const unlockAchievement = async (achievementKey: string) => {
    if (!user) return;

    try {
      // Find achievement by key
      const { data: achievement, error: findError } = await supabase
        .from('achievements')
        .select('id')
        .eq('key', achievementKey)
        .single();

      if (findError || !achievement) {
        console.error('Achievement not found:', achievementKey);
        return;
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
        return;
      }

      // Award achievement to user
      const { error: insertError } = await supabase
        .from('profile_achievements')
        .insert({
          profile_id: user.id,
          achievement_id: achievement.id,
          obtained_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error awarding achievement:', insertError);
        return;
      }

      // Refresh achievements
      await fetchAchievements();
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  };

  return {
    achievements,
    isLoading,
    unlockAchievement,
    refetch: fetchAchievements,
  };
}