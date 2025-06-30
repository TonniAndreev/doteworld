import { supabase } from '@/utils/supabase';

// Types for leaderboard data
export type LeaderboardUser = {
  id: string;
  name: string;
  dogName: string;
  photoURL?: string | null;
  territorySize: number;
  totalDistance: number;
  badgeCount: number;
};

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

export async function fetchLeaderboard(
  category: 'territory' | 'distance' | 'achievements',
  cityId?: string
): Promise<LeaderboardUser[]> {
  try {
    console.log('Fetching leaderboard for category:', category, 'in city:', cityId);
    
    // If we have a city ID, try to use the optimized city leaderboard function
    if (cityId) {
      try {
        console.log('Fetching city leaderboard:', cityId);
        const { data: cityLeaderboard, error: cityLeaderboardError } = await supabase.rpc(
          'get_city_leaderboard',
          {
            p_city_id: cityId,
            p_category: category
          }
        );
        
        if (!cityLeaderboardError && cityLeaderboard) {
          console.log('City leaderboard data received:', cityLeaderboard.length);
          
          // Format the data
          return cityLeaderboard.map(item => ({
            id: item.profile_id,
            name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'User',
            dogName: item.dog_name || 'No dog',
            photoURL: item.avatar_url,
            territorySize: item.territory_size || 0,
            totalDistance: item.total_distance || 0,
            badgeCount: item.badge_count || 0,
          }));
        } else {
          console.error('Error fetching city leaderboard:', cityLeaderboardError);
          console.log('Falling back to old leaderboard method');
        }
      } catch (cityError) {
        console.error('Error fetching city leaderboard:', cityError);
        console.log('Falling back to old leaderboard method');
      }
    }
    
    // Fallback to the original method if city leaderboard fails or no city ID
    console.log('Fetching global leaderboard for category:', category);
    
    // Fetch profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        created_at
      `)
      .limit(100);

    if (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found in database');
      return [];
    }

    console.log('Found profiles:', profiles.length);
    const leaderboardData: LeaderboardUser[] = [];

    for (const profile of profiles) {
      try {
        console.log('Processing profile:', profile.id);
        
        // Get badge count
        const { count: badgeCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        // Get first dog
        const { data: dogData, error: dogError } = await supabase
          .from('profile_dogs')
          .select(`
            dogs (
              id,
              name,
              breed,
              photo_url
            )
          `)
          .eq('profile_id', profile.id)
          .limit(1);

        if (dogError) {
          console.error('Error fetching dogs for profile:', profile.id, dogError);
        }

        const firstDog = dogData?.[0]?.dogs;
        console.log('First dog for profile:', profile.id, firstDog?.name || 'No dog');

        // Calculate stats from walk sessions
        let territorySize = 0;
        let totalDistance = 0;

        if (firstDog?.id) {
          console.log('Fetching walk sessions for dog:', firstDog.id);
          
          // Build query for walk sessions
          let query = supabase
            .from('walk_sessions')
            .select('territory_gained, distance')
            .eq('dog_id', firstDog.id)
            .eq('status', 'completed');
          
          // Add city filter if provided
          if (cityId) {
            query = query.eq('city_id', cityId);
          }
          
          const { data: walkSessions, error: sessionsError } = await query;

          if (sessionsError) {
            console.error('Error fetching walk sessions:', sessionsError);
          } else if (walkSessions && walkSessions.length > 0) {
            console.log('Walk sessions found for user:', profile.id, walkSessions.length);
            
            // Sum up territory and distance from all sessions
            territorySize = walkSessions.reduce((sum, session) => sum + (session.territory_gained || 0), 0);
            totalDistance = walkSessions.reduce((sum, session) => sum + (session.distance || 0), 0);
            
            console.log('Calculated stats:', { territorySize, totalDistance });
          } else {
            console.log('No walk sessions found for user:', profile.id);
          }
        } else {
          console.log('No dog found for profile:', profile.id);
        }

        // If we're filtering by city and user has no territory in this city, skip them
        if (cityId && territorySize === 0 && category === 'territory') {
          console.log('Skipping user with no territory in selected city:', profile.id);
          continue;
        }

        console.log('Final stats for profile:', profile.id, { territorySize, totalDistance, badgeCount });

        leaderboardData.push({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          dogName: firstDog?.name || 'No dog',
          photoURL: profile.avatar_url,
          territorySize,
          totalDistance,
          badgeCount: badgeCount || 0,
        });
      } catch (profileError) {
        console.error('Error processing profile:', profile.id, profileError);
        // Continue with next profile if one fails
        continue;
      }
    }

    console.log('Processed leaderboard data:', leaderboardData.length, 'users');

    // Sort based on category
    const sortedData = leaderboardData.sort((a, b) => {
      switch (category) {
        case 'territory':
          return b.territorySize - a.territorySize;
        case 'distance':
          return b.totalDistance - a.totalDistance;
        case 'achievements':
          return b.badgeCount - a.badgeCount;
        default:
          return 0;
      }
    });

    console.log('Returning sorted leaderboard data:', sortedData.length, 'users');
    return sortedData;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}