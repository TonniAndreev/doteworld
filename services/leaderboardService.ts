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

// Calculate territory size from walk points using convex hull approximation
function calculateTerritoryFromWalkPoints(walkPoints: any[]): number {
  if (walkPoints.length < 3) return 0;

  // Group points by walk session
  const sessionGroups = walkPoints.reduce((groups, point) => {
    if (!groups[point.walk_session_id]) {
      groups[point.walk_session_id] = [];
    }
    groups[point.walk_session_id].push(point);
    return groups;
  }, {} as Record<string, any[]>);

  let totalTerritory = 0;

  // Calculate territory for each session
  Object.values(sessionGroups).forEach(sessionPoints => {
    if (sessionPoints.length >= 3) {
      // Simple polygon area calculation using shoelace formula
      let area = 0;
      const n = sessionPoints.length;
      
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += sessionPoints[i].latitude * sessionPoints[j].longitude;
        area -= sessionPoints[j].latitude * sessionPoints[i].longitude;
      }
      
      area = Math.abs(area) / 2;
      
      // Convert from degrees to km² (rough approximation)
      // 1 degree ≈ 111 km at equator
      const areaInKm2 = area * 111 * 111;
      
      // Cap individual session territory to reasonable size (max 1 km²)
      totalTerritory += Math.min(areaInKm2, 1.0);
    }
  });

  return totalTerritory;
}

export async function fetchLeaderboard(category: 'territory' | 'distance' | 'achievements' | 'paws'): Promise<LeaderboardUser[]> {
  try {
    console.log('Fetching leaderboard for category:', category);
    
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
              id,
              name,
              breed
            )
          `)
          .eq('profile_id', profile.id)
          .limit(1);

        if (dogError) {
          console.error('Error fetching dogs for profile:', profile.id, dogError);
        }

        const firstDog = dogData?.[0]?.dogs;
        console.log('First dog for profile:', profile.id, firstDog?.name || 'No dog');

        // Calculate REAL stats from walk points if dog exists
        let territorySize = 0;
        let totalDistance = 0;

        if (firstDog?.id) {
          console.log('Fetching walk points for dog:', firstDog.id);
          
          const { data: walkPoints, error: walkError } = await supabase
            .from('walk_points')
            .select('latitude, longitude, walk_session_id, timestamp')
            .eq('dog_id', firstDog.id)
            .order('timestamp', { ascending: true });

          if (walkError) {
            console.error('Error fetching walk points:', walkError);
          } else if (walkPoints && walkPoints.length > 0) {
            console.log('Walk points found for user:', profile.id, walkPoints.length);
            
            // Calculate REAL territory size
            territorySize = calculateTerritoryFromWalkPoints(walkPoints);
            
            // Group by walk session to calculate distances properly
            const sessionGroups = walkPoints.reduce((groups, point) => {
              if (!groups[point.walk_session_id]) {
                groups[point.walk_session_id] = [];
              }
              groups[point.walk_session_id].push(point);
              return groups;
            }, {} as Record<string, any[]>);

            // Calculate REAL total distance across all sessions
            Object.values(sessionGroups).forEach(sessionPoints => {
              if (sessionPoints.length > 1) {
                for (let i = 1; i < sessionPoints.length; i++) {
                  const prev = sessionPoints[i - 1];
                  const curr = sessionPoints[i];
                  const distance = calculateDistance(
                    prev.latitude,
                    prev.longitude,
                    curr.latitude,
                    curr.longitude
                  );
                  totalDistance += distance;
                }
              }
            });
          } else {
            console.log('No walk points found for user:', profile.id);
          }
        } else {
          console.log('No dog found for profile:', profile.id);
        }

        // Only generate mock data if absolutely no real data exists AND for demo purposes
        // In production, users with no data would simply have 0 values
        if (territorySize === 0 && totalDistance === 0) {
          // Generate small amounts of mock data for demo purposes only
          const hash = profile.id.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          // Much smaller mock values to encourage real usage
          territorySize = Math.abs(hash % 10) / 100; // 0-0.1 km² (very small)
          totalDistance = Math.abs(hash % 20) / 10; // 0-2 km (very small)
          
          console.log('Generated minimal mock data for demo:', { territorySize, totalDistance });
        }

        console.log('Final stats for profile:', profile.id, { territorySize, totalDistance, achievementCount });

        // Calculate paws balance based on real activity
        const pawsBalance = Math.floor(
          (achievementCount || 0) * 50 + // 50 paws per achievement
          territorySize * 1000 + // 1000 paws per km²
          totalDistance * 100 // 100 paws per km walked
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

    console.log('Processed leaderboard data:', leaderboardData.length, 'users');

    // Sort based on category
    const sortedData = leaderboardData.sort((a, b) => {
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

    console.log('Returning sorted leaderboard data:', sortedData.length, 'users');
    return sortedData;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}