import { supabase } from '@/utils/supabase';

// Types for leaderboard data
export type LeaderboardUser = {
  id: string;
  name: string;
  dogName: string;
  photoURL?: string | null;
  territorySize: number;
  totalDistance: number;
  achievementCount: number;
  pawsBalance: number;
};
export async function fetchLeaderboard(category: 'territory' | 'distance' | 'achievements' | 'paws'): Promise<LeaderboardUser[]> {
  try {
    // Fetch profiles with their dogs and achievements
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        profile_dogs (
          dogs (
            name,
            breed
          )
        )
      `)
      .limit(50);

    if (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }

    const leaderboardData: LeaderboardUser[] = [];

    for (const profile of profiles || []) {
      // Get achievement count
      const { count: achievementCount } = await supabase
        .from('profile_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      // Get first dog
      const firstDog = profile.profile_dogs?.[0]?.dogs;

      leaderboardData.push({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        dogName: firstDog?.name || 'No dog',
        territorySize: Math.random() * 15, // This would be calculated from territory data
        totalDistance: Math.random() * 100, // This would be calculated from walk_points data
        achievementCount: achievementCount || 0,
        pawsBalance: Math.floor(Math.random() * 1500), // This would come from a paws balance system
      });
    }

    // Sort based on category
    return leaderboardData.sort((a, b) => {
      switch (category) {
        case 'territory':
          return b.territorySize - a.territorySize;
        case 'distance':
          return b.totalDistance - a.totalDistance;
        case 'achievements':
          return b.achievementCount - a.achievementCount;
        case 'paws':
          return b.pawsBalance - a.pawsBalance;
        default:
          return 0;
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}