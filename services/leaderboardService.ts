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
        avatar_url,
        created_at
      `)
      .limit(50);

    if (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }

    const leaderboardData: LeaderboardUser[] = [];

    for (const profile of profiles || []) {
      try {
        // Get achievement count
        const { count: achievementCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        // Get first dog
        const { data: dogData, error: dogError } = await supabase
          .from('profile_dogs')
          .select(`
            dogs (
              name,
              breed
            )
          `);

        console.log('Walk points found for user:', profile.id, walkPoints.length);

        const firstDog = dogData?.[0]?.dogs;

        // Calculate territory size from walk points
        const { data: walkPoints, error: walkError } = await supabase
          .from('walk_points')
          .select('latitude, longitude')
          .eq('dog_id', firstDog?.id || 'none'); // Use dog_id if available

        let territorySize = 0;
        let totalDistance = 0;
            
        console.log('Walk sessions for user:', profile.id, Object.keys(sessionGroups).length);
            
        // Calculate total distance and territory across all sessions

        if (walkPoints && walkPoints.length > 0) {
          // Simple calculation: assume each walk point represents ~0.001 km²
          territorySize = walkPoints.length * 0.001;
          
          // Calculate total distance (simplified)
          if (walkPoints.length > 1) {
            for (let i = 1; i < walkPoints.length; i++) {
                // Each session with 3+ points contributes to territory
                if (sessionPoints.length >= 3) {
                  totalDistance += calculateDistance(
                    walkPoints[i-1].latitude,
                    walkPoints[i-1].longitude,
                    walkPoints[i].latitude,
                    walkPoints[i].longitude
                  );
                }
            }
          }
        }

        // Generate a consistent paws balance based on user activity
        const pawsBalance = Math.floor(
          (achievementCount || 0) * 50 + // 50 paws per achievement
          territorySize * 100 + // 100 paws per km²
          totalDistance * 10 // 10 paws per km walked
        );

        leaderboardData.push({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          dogName: firstDog?.name || 'No dog',
          photoURL: profile.avatar_url,
          territorySize,
          totalDistance,
          achievementCount: achievementCount || 0,
          pawsBalance,
        });
      } catch (profileError) {
        console.error('Error processing profile:', profile.id, profileError);
        // Continue with next profile if one fails
        continue;
      }
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

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Returns distance in kilometers
}

// Helper function to convert degrees to radians
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}