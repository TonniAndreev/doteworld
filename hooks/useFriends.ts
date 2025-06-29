import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import * as turf from '@turf/turf';
import { 
  createConvexHull, 
  coordinatesToTurfPolygon,
  calculatePolygonArea
} from '@/utils/locationUtils';
import { getFriendTerritoryColor } from '@/utils/mapColors';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface User {
  id: string;
  name: string;
  dogName: string;
  dogBreed?: string;
  photoURL?: string | null;
  territorySize: number;
  totalDistance: number;
  achievementCount: number;
  requestSent?: boolean;
  isFriend?: boolean;
  dogs?: Array<{
    id: string;
    name: string;
    breed?: string;
    photo_url?: string | null;
  }>;
  // New fields for territory visualization
  territoryPolygons?: Array<{
    id: string;
    coordinates: Coordinate[];
    color: string;
    dogId: string;
    dogName: string;
    dogPhotoURL?: string | null;
    dogBreed?: string;
    centroid?: Coordinate;
  }>;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderDogName: string;
  senderPhotoURL?: string | null;
  timestamp: string;
  status: string;
  senderDogs?: Array<{
    id: string;
    name: string;
    breed?: string;
    photo_url?: string | null;
  }>;
}

export function useFriends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Use ref to track subscription status
  const friendshipsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
      
      // Clean up any existing subscription before creating a new one
      if (friendshipsChannelRef.current) {
        console.log('Removing existing friendships channel subscription');
        supabase.removeChannel(friendshipsChannelRef.current);
        friendshipsChannelRef.current = null;
      }
      
      // Create a unique channel name that includes the user ID to avoid conflicts
      const channelName = `friendships-changes-${user.id}-${Date.now()}`;
      console.log(`Creating new channel: ${channelName}`);
      
      // Set up real-time listeners for friendship changes
      friendshipsChannelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friendships',
            filter: `or(requester_id.eq.${user.id},receiver_id.eq.${user.id})`,
          },
          (payload) => {
            console.log('Friendship change detected:', payload);
            loadData();
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${channelName}:`, status);
        });
         
      return () => {
        // Clean up subscription when component unmounts or user changes
        if (friendshipsChannelRef.current) {
          console.log('Cleaning up friendships channel subscription');
          supabase.removeChannel(friendshipsChannelRef.current);
          friendshipsChannelRef.current = null;
        }
      };
    }
  }, [user?.id]); // Only re-run if user ID changes

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchFriends(), fetchFriendRequests()]);
    setIsLoading(false);
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Get accepted friendships where current user is either requester or receiver
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (friendshipsError) {
        console.error('Error fetching friendships:', friendshipsError);
        return;
      }

      const friendsData: User[] = [];

      for (const friendship of friendships || []) {
        // Get the friend's ID (the other person in the friendship)
        const friendId = friendship.requester_id === user.id 
          ? friendship.receiver_id 
          : friendship.requester_id;

        // Get friend's profile
        const { data: friendProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', friendId)
          .single();

        if (profileError || !friendProfile) {
          console.error('Error fetching friend profile:', profileError);
          continue;
        }

        // Get friend's dogs
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
          .eq('profile_id', friendId);

        if (dogError) {
          console.error('Error fetching friend dogs:', dogError);
        }

        const dogs = dogData?.map(item => item.dogs) || [];
        const firstDog = dogs[0] || null;

        // Get friend's achievement count
        const { count: achievementCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', friendId);

        // Calculate REAL territory and distance from walk points
        let territorySize = 0;
        let totalDistance = 0;
        
        // Array to store territory polygons for this friend
        const territoryPolygons: User['territoryPolygons'] = [];
        
        // Process each dog's territory
        for (const dog of dogs) {
          if (!dog || !dog.id) continue;
          
          const { data: walkPoints, error: walkError } = await supabase
            .from('walk_points')
            .select('latitude, longitude, walk_session_id, timestamp')
            .eq('dog_id', dog.id)
            .order('timestamp', { ascending: true });

          if (walkError) {
            console.error(`Error fetching walk points for dog ${dog.id}:`, walkError);
            continue;
          }

          if (!walkPoints || walkPoints.length < 3) {
            console.log(`No valid walk points found for dog ${dog.id}`);
            continue;
          }

          // Group points by walk session
          const sessionGroups = walkPoints.reduce((groups, point) => {
            if (!groups[point.walk_session_id]) {
              groups[point.walk_session_id] = [];
            }
            groups[point.walk_session_id].push(point);
            return groups;
          }, {} as Record<string, any[]>);

          // Process each walk session to create territory polygons
          for (const [sessionId, sessionPoints] of Object.entries(sessionGroups)) {
            if (sessionPoints.length < 3) continue;
            
            // Create coordinates array
            const coordinates = sessionPoints.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude
            }));
            
            // Create convex hull
            const hull = createConvexHull(coordinates);
            if (!hull) continue;
            
            // Calculate area
            const area = calculatePolygonArea(hull);
            territorySize += area;
            
            // Calculate centroid
            const turfPolygon = coordinatesToTurfPolygon(hull);
            let centroid: Coordinate | undefined;
            
            if (turfPolygon) {
              const turfCentroid = turf.centroid(turfPolygon);
              centroid = {
                latitude: turfCentroid.geometry.coordinates[1],
                longitude: turfCentroid.geometry.coordinates[0]
              };
            }
            
            // Get color for this friend
            const color = await getFriendTerritoryColor(friendId);
            
            // Add to territory polygons
            territoryPolygons.push({
              id: sessionId,
              coordinates: hull,
              color,
              dogId: dog.id,
              dogName: dog.name,
              dogPhotoURL: dog.photo_url,
              dogBreed: dog.breed,
              centroid
            });
          }

          // Calculate total distance (reusing existing code)
          if (walkPoints.length > 1) {
            totalDistance += calculateRealDistanceFromWalkPoints(walkPoints);
          }
        }

        friendsData.push({
          id: friendId,
          name: `${friendProfile.first_name || ''} ${friendProfile.last_name || ''}`.trim() || 'User',
          dogName: firstDog?.name || 'No dog',
          dogBreed: firstDog?.breed || '',
          photoURL: friendProfile.avatar_url,
          territorySize,
          totalDistance,
          achievementCount: achievementCount || 0,
          isFriend: true,
          dogs: dogs,
          territoryPolygons
        });
      }

      setFriends(friendsData);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      // Get pending friend requests where current user is the receiver
      const { data: requests, error: requestsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error fetching friend requests:', requestsError);
        return;
      }

      const requestsData: FriendRequest[] = [];

      for (const request of requests || []) {
        // Get requester's profile
        const { data: requesterProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', request.requester_id)
          .single();

        if (profileError || !requesterProfile) {
          console.error('Error fetching requester profile:', profileError);
          continue;
        }

        // Get requester's dogs
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
          .eq('profile_id', request.requester_id);

        if (dogError) {
          console.error('Error fetching requester dogs:', dogError);
        }

        const dogs = dogData?.map(item => item.dogs) || [];
        const firstDog = dogs[0] || null;

        requestsData.push({
          id: request.id,
          senderId: request.requester_id,
          senderName: `${requesterProfile.first_name || ''} ${requesterProfile.last_name || ''}`.trim() || 'User',
          senderDogName: firstDog?.name || 'No dog',
          senderPhotoURL: requesterProfile.avatar_url,
          timestamp: request.created_at,
          status: request.status,
          senderDogs: dogs,
        });
      }

      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchUsers = (query: string): User[] => {
    // Kept for backward compatibility - returns empty array
    return [];
  };

  const searchUsersAsync = async (query: string): Promise<User[]> => {
    if (!user || !query.trim()) return [];

    try {
      // Search profiles by name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      const searchResults: User[] = [];

      for (const profile of profiles || []) {
        // Check if already friends or request exists
        const { data: existingRelation } = await supabase
          .from('friendships')
          .select('status, requester_id, receiver_id')
          .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${user.id})`)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no relation exists

        // Get user's dogs
        const { data: dogData } = await supabase
          .from('profile_dogs')
          .select(`
            dogs (
              id,
              name,
              breed,
              photo_url
            )
          `)
          .eq('profile_id', profile.id);

        if (dogData) {
          console.log(`Found ${dogData.length} dogs for user ${profile.id}`);
        }

        const dogs = dogData?.map(item => item.dogs) || [];
        const firstDog = dogs[0] || null;

        // Get achievement count
        const { count: achievementCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        // Calculate REAL territory and distance from walk points
        let territorySize = 0;
        let totalDistance = 0;
        
        if (firstDog) {
          const { data: walkPoints, error: walkError } = await supabase
            .from('walk_points')
            .select('latitude, longitude, walk_session_id, timestamp')
            .eq('dog_id', firstDog.id)
            .order('timestamp', { ascending: true });

          if (!walkError && walkPoints && walkPoints.length > 0) {
            territorySize = calculateRealTerritoryFromWalkPoints(walkPoints);
            totalDistance = calculateRealDistanceFromWalkPoints(walkPoints);
          }
        }

        const isFriend = existingRelation?.status === 'accepted';
        const requestSent = existingRelation?.status === 'pending' && existingRelation?.requester_id === user.id;
        const requestReceived = existingRelation?.status === 'pending' && existingRelation?.receiver_id === user.id;

        searchResults.push({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          dogName: firstDog?.name || 'No dog',
          dogBreed: firstDog?.breed || '',
          photoURL: profile.avatar_url,
          territorySize,
          totalDistance,
          achievementCount: achievementCount || 0,
          isFriend,
          requestSent,
          dogs: dogs,
        });
      }

      return searchResults;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!user) return;

    try {
      // Check if friendship already exists
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existingFriendship) {
        console.log('Friendship already exists:', existingFriendship.status);
        return;
      }

      // Create new friend request
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          receiver_id: userId,
          status: 'pending',
        });

      if (insertError) {
        console.error('Error sending friend request:', insertError);
        return;
      }

      console.log('Friend request sent successfully');
      
      // Refresh data to update UI
      await loadData();
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('receiver_id', user.id); // Ensure only the receiver can accept

      if (error) {
        console.error('Error accepting friend request:', error);
        return;
      }

      console.log('Friend request accepted');
      
      // Update local state
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Refresh friends list to include the newly accepted friend
      await fetchFriends();
      
      return true; // Return success indicator
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('receiver_id', user.id); // Ensure only the receiver can decline

      if (error) {
        console.error('Error declining friend request:', error);
        return;
      }

      console.log('Friend request declined');
      
      // Update local state
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      return true; // Return success indicator
    } catch (error) {
      console.error('Error declining friend request:', error);
      return false;
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return false;

    try {
      console.log(`Removing friend with ID: ${friendId}`);
      
      // Delete the friendship record
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${user.id})`);

      if (error) {
        console.error('Error removing friend:', error);
        return false;
      }

      console.log('Friend removed successfully');
      
      // Update local state to remove the friend
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
      
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  };

  const cancelFriendRequest = async (userId: string) => {
    if (!user) return false;

    try {
      console.log(`Canceling friend request to user ID: ${userId}`);
      
      // Delete the pending friendship record where current user is the requester
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', user.id)
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error canceling friend request:', error);
        return false;
      }

      console.log('Friend request canceled successfully');
      
      // Refresh data to update UI
      await loadData();
      
      return true;
    } catch (error) {
      console.error('Error canceling friend request:', error);
      return false;
    }
  };

  // Helper functions for territory calculations (same as leaderboard service)
  const calculateRealTerritoryFromWalkPoints = (walkPoints: any[]): number => {
    if (walkPoints.length < 3) return 0;

    const sessionGroups = walkPoints.reduce((groups, point) => {
      if (!groups[point.walk_session_id]) {
        groups[point.walk_session_id] = [];
      }
      groups[point.walk_session_id].push(point);
      return groups;
    }, {} as Record<string, any[]>);

    let totalTerritory = 0;

    Object.values(sessionGroups).forEach(sessionPoints => {
      if (sessionPoints.length >= 3) {
        sessionPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
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
        
        const avgLat = sessionPoints.reduce((sum, p) => sum + p.latitude, 0) / sessionPoints.length;
        const latConversion = 111.32;
        const lonConversion = 111.32 * Math.cos(toRad(avgLat));
        
        const areaInKm2 = area * latConversion * lonConversion;
        
        if (areaInKm2 > 0.0001 && areaInKm2 < 10) {
          totalTerritory += areaInKm2;
        }
      }
    });

    return totalTerritory;
  };

  const calculateRealDistanceFromWalkPoints = (walkPoints: any[]): number => {
    if (walkPoints.length < 2) return 0;

    const sessionGroups = walkPoints.reduce((groups, point) => {
      if (!groups[point.walk_session_id]) {
        groups[point.walk_session_id] = [];
      }
      groups[point.walk_session_id].push(point);
      return groups;
    }, {} as Record<string, any[]>);

    let totalDistance = 0;

    Object.values(sessionGroups).forEach(sessionPoints => {
      if (sessionPoints.length > 1) {
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
          
          if (distance > 0 && distance < 1) {
            totalDistance += distance;
          }
        }
      }
    });

    return totalDistance;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  return {
    friends,
    friendRequests,
    isLoading,
    searchUsers,
    searchUsersAsync,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    cancelFriendRequest,
    refetch: loadData,
  };
}