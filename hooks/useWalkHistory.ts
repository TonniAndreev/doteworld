import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface WalkHistoryItem {
  id: string;
  dog_id: string;
  dog_name?: string;
  start_time: string;
  end_time?: string;
  distance: number;
  duration: number;
  territory_gained: number;
  points_count: number;
  route_data?: any;
}

interface WalkHistoryStats {
  totalWalks: number;
  totalDistance: number;
  totalTerritory: number;
  totalDuration: number;
  lastWalkDate?: string;
}

export function useWalkHistory(dogId?: string) {
  const [walkHistory, setWalkHistory] = useState<WalkHistoryItem[]>([]);
  const [stats, setStats] = useState<WalkHistoryStats>({
    totalWalks: 0,
    totalDistance: 0,
    totalTerritory: 0,
    totalDuration: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWalkHistory();
      fetchWalkStats();
    }
  }, [user, dogId]);

  const fetchWalkHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('walk_history')
        .select(`
          *,
          dogs (name)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (dogId) {
        query = query.eq('dog_id', dogId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching walk history:', fetchError);
        setError(fetchError.message);
        return;
      }

      const formattedData = data.map(item => ({
        id: item.id,
        dog_id: item.dog_id,
        dog_name: item.dogs?.name,
        start_time: item.start_time,
        end_time: item.end_time,
        distance: item.distance,
        duration: item.duration,
        territory_gained: item.territory_gained,
        points_count: item.points_count,
        route_data: item.route_data,
      }));

      setWalkHistory(formattedData);
    } catch (err) {
      console.error('Error in fetchWalkHistory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalkStats = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('user_walk_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data, error: fetchError } = await query;

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error fetching walk stats:', fetchError);
        return;
      }

      if (data) {
        setStats({
          totalWalks: data.total_walks || 0,
          totalDistance: data.total_distance || 0,
          totalTerritory: data.total_territory || 0,
          totalDuration: data.total_duration || 0,
          lastWalkDate: data.last_walk_date,
        });
      }
    } catch (err) {
      console.error('Error in fetchWalkStats:', err);
    }
  };

  const addWalkHistoryEntry = async (walkData: Omit<WalkHistoryItem, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('walk_history')
        .insert({
          ...walkData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding walk history entry:', error);
        return null;
      }

      // Refresh walk history
      fetchWalkHistory();
      fetchWalkStats();

      return data;
    } catch (err) {
      console.error('Error in addWalkHistoryEntry:', err);
      return null;
    }
  };

  const deleteWalkHistoryEntry = async (walkId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('walk_history')
        .delete()
        .eq('id', walkId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting walk history entry:', error);
        return false;
      }

      // Refresh walk history
      fetchWalkHistory();
      fetchWalkStats();

      return true;
    } catch (err) {
      console.error('Error in deleteWalkHistoryEntry:', err);
      return false;
    }
  };

  return {
    walkHistory,
    stats,
    isLoading,
    error,
    refetch: fetchWalkHistory,
    addWalkHistoryEntry,
    deleteWalkHistoryEntry,
  };
}