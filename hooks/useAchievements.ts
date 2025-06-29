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

      // Define achievement metadata based on key
      const achievementMetadata: { [key: string]: { targetValue: number, unit: string, pawsReward: number } } = {
        'first_steps': { targetValue: 1, unit: 'walk', pawsReward: 1 },
        'territory_king': { targetValue: 0.1, unit: 'km²', pawsReward: 5 }, // 100,000 m²
        'social_butterfly': { targetValue: 3, unit: 'friends', pawsReward: 3 },
        'marathon_walker': { targetValue: 42.2, unit: 'km', pawsReward: 10 },
        'early_bird': { targetValue: 1, unit: 'walk', pawsReward: 2 },
        'night_owl': { targetValue: 1, unit: 'walk', pawsReward: 2 },
        'city_explorer': { targetValue: 3, unit: 'cities', pawsReward: 5 },
        'consistent_walker': { targetValue: 7, unit: 'days', pawsReward: 7 },
        'dog_whisperer': { targetValue: 3, unit: 'dogs', pawsReward: 3 },
        'territory_giant': { targetValue: 1, unit: 'km²', pawsReward: 15 }, // 1,000,000 m²
      };

      // Combine achievements with completion status and progress
      const achievementsWithStatus: Achievement[] = allAchievements?.map(achievement => {
        const isCompleted = completedAchievementIds.has(achievement.id);
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        const progress = storedProgress[achievement.key] || { currentValue: 0, lastChecked: new Date().toISOString() };
        
        // Get metadata for this achievement
        const metadata = achievementMetadata[achievement.key] || { targetValue: 1, unit: 'completion', pawsReward: 1 };
        
        // For completed achievements, ensure currentValue matches targetValue
        const currentValue = isCompleted ? metadata.targetValue : progress.currentValue;

        return {
          id: achievement.id,
          key: achievement.key,
          title: achievement.title,
          description: achievement.description || '',
          icon_url: achievement.icon_url || 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300',
          completed: isCompleted,
          currentValue: currentValue,
          targetValue: metadata.targetValue,
          unit: metadata.unit,
          pawsReward: metadata.pawsReward,
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
            newlyCompleted = { ...socialButterflyAchievement, completed: true, currentValue: 3 };
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
            newlyCompleted = { ...territoryKingAchievement, completed: true, currentValue: 0.1 };
          }
        } else if (totalTerritory > 0) {
          // Update progress
          updatedProgress['territory_king'] = {
            currentValue: totalTerritory / 0.1,
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Check for "Marathon Walker" achievement
      const marathonWalkerAchievement = achievements.find(a => a.key === 'marathon_walker');
      if (marathonWalkerAchievement && !marathonWalkerAchievement.completed) {
        // Get user's total distance walked
        const { data: walkSessions } = await supabase
          .from('walk_sessions')
          .select('distance')
          .eq('status', 'completed');
        
        const totalDistance = walkSessions?.reduce((sum, session) => sum + (session.distance || 0), 0) || 0;
        
        if (totalDistance >= 42.2) { // 42.2 km (marathon distance)
          // User has walked a marathon distance, award the achievement
          const result = await unlockAchievement('marathon_walker');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...marathonWalkerAchievement, completed: true, currentValue: 42.2 };
          }
        } else if (totalDistance > 0) {
          // Update progress
          updatedProgress['marathon_walker'] = {
            currentValue: totalDistance / 42.2,
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Check for "Early Bird" achievement
      const earlyBirdAchievement = achievements.find(a => a.key === 'early_bird');
      if (earlyBirdAchievement && !earlyBirdAchievement.completed) {
        // Check if user has any walks that started before 7 AM
        const { count } = await supabase
          .from('walk_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .filter('started_at', 'not.is', null)
          .filter('EXTRACT(HOUR FROM started_at)', 'lt', 7);
        
        if (count && count > 0) {
          // User has early morning walks, award the achievement
          const result = await unlockAchievement('early_bird');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...earlyBirdAchievement, completed: true, currentValue: 1 };
          }
        } else {
          // Update progress (binary achievement - either 0 or 1)
          updatedProgress['early_bird'] = {
            currentValue: 0,
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Check for "Night Owl" achievement
      const nightOwlAchievement = achievements.find(a => a.key === 'night_owl');
      if (nightOwlAchievement && !nightOwlAchievement.completed) {
        // Check if user has any walks that ended after 10 PM
        const { count } = await supabase
          .from('walk_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .filter('ended_at', 'not.is', null)
          .filter('EXTRACT(HOUR FROM ended_at)', 'gte', 22);
        
        if (count && count > 0) {
          // User has late night walks, award the achievement
          const result = await unlockAchievement('night_owl');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...nightOwlAchievement, completed: true, currentValue: 1 };
          }
        } else {
          // Update progress (binary achievement - either 0 or 1)
          updatedProgress['night_owl'] = {
            currentValue: 0,
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Check for "City Explorer" achievement
      const cityExplorerAchievement = achievements.find(a => a.key === 'city_explorer');
      if (cityExplorerAchievement && !cityExplorerAchievement.completed) {
        // Get distinct cities where user has walked
        const { data: cities } = await supabase
          .from('walk_sessions')
          .select('city_id')
          .eq('status', 'completed')
          .filter('city_id', 'not.is', null)
          .filter('territory_gained', 'gt', 0);
        
        // Count unique city IDs
        const uniqueCityIds = new Set(cities?.map(c => c.city_id));
        const uniqueCitiesCount = uniqueCityIds.size;
        
        if (uniqueCitiesCount >= 3) {
          // User has conquered territory in at least 3 cities
          const result = await unlockAchievement('city_explorer');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...cityExplorerAchievement, completed: true, currentValue: 3 };
          }
        } else if (uniqueCitiesCount > 0) {
          // Update progress
          updatedProgress['city_explorer'] = {
            currentValue: uniqueCitiesCount / 3,
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Check for "Consistent Walker" achievement
      const consistentWalkerAchievement = achievements.find(a => a.key === 'consistent_walker');
      if (consistentWalkerAchievement && !consistentWalkerAchievement.completed) {
        // Get all walk sessions ordered by date
        const { data: walkSessions } = await supabase
          .from('walk_sessions')
          .select('started_at')
          .eq('status', 'completed')
          .order('started_at', { ascending: true });
        
        if (walkSessions && walkSessions.length > 0) {
          // Process dates to find consecutive days
          const walkDates = walkSessions.map(session => {
            const date = new Date(session.started_at);
            return date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
          });
          
          // Remove duplicates to get unique days
          const uniqueDates = [...new Set(walkDates)].sort();
          
          // Calculate longest streak
          let currentStreak = 1;
          let longestStreak = 1;
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i-1]);
            const currDate = new Date(uniqueDates[i]);
            
            // Check if dates are consecutive
            const diffTime = currDate.getTime() - prevDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
              // Consecutive day
              currentStreak++;
              longestStreak = Math.max(longestStreak, currentStreak);
            } else if (diffDays > 1) {
              // Streak broken
              currentStreak = 1;
            }
          }
          
          if (longestStreak >= 7) {
            // User has walked 7+ consecutive days
            const result = await unlockAchievement('consistent_walker');
            if (result && !newlyCompleted) {
              newlyCompleted = { ...consistentWalkerAchievement, completed: true, currentValue: 7 };
            }
          } else {
            // Update progress
            updatedProgress['consistent_walker'] = {
              currentValue: longestStreak / 7,
              lastChecked: new Date().toISOString()
            };
          }
        }
      }
      
      // Check for "Dog Whisperer" achievement
      const dogWhispererAchievement = achievements.find(a => a.key === 'dog_whisperer');
      if (dogWhispererAchievement && !dogWhispererAchievement.completed) {
        // Count user's dogs
        const { count: dogCount } = await supabase
          .from('profile_dogs')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id);
        
        if (dogCount && dogCount >= 3) {
          // User has 3+ dogs
          const result = await unlockAchievement('dog_whisperer');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...dogWhispererAchievement, completed: true, currentValue: 3 };
          }
        } else if (dogCount) {
          // Update progress
          updatedProgress['dog_whisperer'] = {
            currentValue: dogCount / 3,
            lastChecked: new Date().toISOString()
          };
        }
      }
      
      // Check for "Territory Giant" achievement
      const territoryGiantAchievement = achievements.find(a => a.key === 'territory_giant');
      if (territoryGiantAchievement && !territoryGiantAchievement.completed) {
        // Get user's total territory
        const { data: walkSessions } = await supabase
          .from('walk_sessions')
          .select('territory_gained')
          .eq('status', 'completed');
        
        const totalTerritory = walkSessions?.reduce((sum, session) => sum + (session.territory_gained || 0), 0) || 0;
        
        if (totalTerritory >= 1) { // 1 km² = 1,000,000 m²
          // User has conquered enough territory, award the achievement
          const result = await unlockAchievement('territory_giant');
          if (result && !newlyCompleted) {
            newlyCompleted = { ...territoryGiantAchievement, completed: true, currentValue: 1 };
          }
        } else if (totalTerritory > 0) {
          // Update progress
          updatedProgress['territory_giant'] = {
            currentValue: totalTerritory / 1,
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