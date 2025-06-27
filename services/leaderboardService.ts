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

// Calculate REAL territory size from walk points using proper polygon area calculation
function calculateRealTerritoryFromWalkPoints(walkPoints: any[]): number {
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

  // Calculate territory for each session using REAL polygon area calculation
  Object.values(sessionGroups).forEach(sessionPoints => {
    if (sessionPoints.length >= 3) {
      // Sort points by timestamp to get proper order
      sessionPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Use shoelace formula for polygon area calculation
      let area = 0;
      const n = sessionPoints.length;
      
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const xi = sessionPoints[i].longitude;
        const yi = sessionPoints[i].latitude;
        const xj = sessionPoints[j].longitude;
        const yj = sessionPoints[j].latitude;
        
        area += (xi * yj - xj * yi);
      }
      
      area = Math.abs(area) / 2;
      
      // Convert from degrees² to km² using proper conversion
      // At equator: 1 degree latitude ≈ 111.32 km, 1 degree longitude ≈ 111.32 km * cos(latitude)
      // For simplicity, we'll use average latitude for the conversion
      const avgLat = sessionPoints.reduce((sum, p) => sum + p.latitude, 0) / sessionPoints.length;
      const latConversion = 111.32; // km per degree latitude
      const lonConversion = 111.32 * Math.cos(toRad(avgLat)); // km per degree longitude
      
      const areaInKm2 = area * latConversion * lonConversion;
      
      // Only add reasonable territory sizes (filter out GPS noise)
      if (areaInKm2 > 0.0001 && areaInKm2 < 10) { // Between 100m² and 10km²
        totalTerritory += areaInKm2;
      }
    }
  });

  return totalTerritory;
}

// Calculate REAL total distance from walk points
function calculateRealDistanceFromWalkPoints(walkPoints: any[]): number {
  if (walkPoints.length < 2) return 0;

  // Group by walk session
  const sessionGroups = walkPoints.reduce((groups, point) => {
    if (!groups[point.walk_session_id]) {
      groups[point.walk_session_id] = [];
    }
    groups[point.walk_session_id].push(point);
    return groups;
  }, {} as Record<string, any[]>);

  let totalDistance = 0;

  // Calculate distance for each session
  Object.values(sessionGroups).forEach(sessionPoints => {
    if (sessionPoints.length > 1) {
      // Sort by timestamp to get proper order
      sessionPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      for (let i = 1; i < sessionPoints.length; i++) {
        const prev = sessionPoints[i - 1];
        const curr = sessionPoints[i];
        const distance = calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        );
        
        // Only add reasonable distances (filter out GPS jumps)
        if (distance > 0 && distance < 1) { // Max 1km between consecutive points
          totalDistance += distance;
        }
      }
    }
  });

  return totalDistance;
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
            
            // Calculate REAL territory size using proper polygon calculations
            territorySize = calculateRealTerritoryFromWalkPoints(walkPoints);
            
            // Calculate REAL total distance
            totalDistance = calculateRealDistanceFromWalkPoints(walkPoints);
            
            console.log('REAL calculated stats:', { territorySize, totalDistance });
          } else {
            console.log('No walk points found for user:', profile.id);
          }
        } else {
          console.log('No dog found for profile:', profile.id);
        }

        console.log('Final REAL stats for profile:', profile.id, { territorySize, totalDistance, achievementCount });

        // Calculate paws balance based on REAL activity
        const pawsBalance = Math.floor(
          (achievementCount || 0) * 50 + // 50 paws per achievement
          territorySize * 10000 + // 10,000 paws per km² (higher reward for territory)
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