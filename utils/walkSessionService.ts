import { supabase } from './supabase';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface WeatherConditions {
  temperature?: number;
  conditions?: string;
  humidity?: number;
  windSpeed?: number;
}

interface WalkSession {
  id: string;
  dog_id: string;
  started_at: string;
  ended_at?: string;
  distance: number;
  points_count: number;
  territory_gained: number;
  status: 'active' | 'completed' | 'cancelled';
  weather_conditions?: WeatherConditions;
  created_at: string;
}

/**
 * Start a new walk session for a dog
 */
export async function startWalkSession(
  dogId: string,
  weatherConditions?: WeatherConditions
): Promise<{ sessionId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('walk_sessions')
      .insert({
        dog_id: dogId,
        status: 'active',
        weather_conditions: weatherConditions || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting walk session:', error);
      return { sessionId: null, error: error.message };
    }

    return { sessionId: data.id, error: null };
  } catch (error) {
    console.error('Error in startWalkSession:', error);
    return { 
      sessionId: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Add a walk point to an active session
 */
export async function addWalkPoint(
  sessionId: string,
  dogId: string,
  coordinates: Coordinate
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('walk_points')
      .insert({
        dog_id: dogId,
        walk_session_id: sessionId, // Keep for backward compatibility
        session_id: sessionId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

    if (error) {
      console.error('Error adding walk point:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in addWalkPoint:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Complete a walk session with final statistics
 */
export async function completeWalkSession(
  sessionId: string,
  stats: {
    distance: number;
    territoryGained: number;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('walk_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        distance: stats.distance,
        territory_gained: stats.territoryGained,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing walk session:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in completeWalkSession:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Cancel an active walk session
 */
export async function cancelWalkSession(
  sessionId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('walk_sessions')
      .update({
        status: 'cancelled',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error cancelling walk session:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in cancelWalkSession:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get walk sessions for a dog
 */
export async function getWalkSessions(
  dogId: string,
  limit: number = 10,
  status?: 'active' | 'completed' | 'cancelled'
): Promise<{ sessions: WalkSession[]; error: string | null }> {
  try {
    let query = supabase
      .from('walk_sessions')
      .select('*')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching walk sessions:', error);
      return { sessions: [], error: error.message };
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    console.error('Error in getWalkSessions:', error);
    return { 
      sessions: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get walk points for a session
 */
export async function getWalkPoints(
  sessionId: string
): Promise<{ points: Coordinate[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('walk_points')
      .select('latitude, longitude, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching walk points:', error);
      return { points: [], error: error.message };
    }

    const points = data?.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })) || [];

    return { points, error: null };
  } catch (error) {
    console.error('Error in getWalkPoints:', error);
    return { 
      points: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get walk statistics for a dog
 */
export async function getDogWalkStats(
  dogId: string
): Promise<{ 
  totalWalks: number; 
  totalDistance: number; 
  totalTerritory: number;
  error: string | null 
}> {
  try {
    const { data, error } = await supabase
      .from('walk_statistics')
      .select('*')
      .eq('dog_id', dogId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching dog walk stats:', error);
      return { 
        totalWalks: 0, 
        totalDistance: 0, 
        totalTerritory: 0,
        error: error.message 
      };
    }

    return { 
      totalWalks: data?.total_walks || 0, 
      totalDistance: data?.total_distance || 0, 
      totalTerritory: data?.total_territory_gained || 0,
      error: null 
    };
  } catch (error) {
    console.error('Error in getDogWalkStats:', error);
    return { 
      totalWalks: 0, 
      totalDistance: 0, 
      totalTerritory: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}