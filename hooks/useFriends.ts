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
  badgeCount?: number;
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
    await Promise.all([fetchFriendRequests(), fetchFriends()]);
    setIsLoading(false);
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      console.log('Fetching friends for user:', user.id);
      
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

      console.log(`Found ${friendships?.length || 0} friendships`);
      
      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }
      
      // Extract friend IDs
      const friendIds = friendships.map(friendship => 
        friendship.requester_id === user.id ? friendship.receiver_id : friendship.requester_id
      );
      
      // Fetch all friend data in a single query using the public_user_stats view
      const { data: friendsData, error: friendsError } = await supabase
        .from('public_user_stats')
        .select('*')
        .in('id', friendIds);
        
      if (friendsError) {
        console.error('Error fetching friends data:', friendsError);
        return;
      }
      
      console.log(`Fetched data for ${friendsData?.length || 0} friends`);
      
      // Process friend data
      const processedFriends = await Promise.all((friendsData || []).map(async (friend) => {
        // Format friend data
        const friendData: User = {
          id: friend.id,
          name: `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || 'User',
          dogName: friend.primary_dog_name || 'No dog',
          dogBreed: friend.primary_dog_breed || '',
          photoURL: friend.avatar_url,
          territorySize: friend.territory_size || 0,
          totalDistance: friend.total_distance || 0,
          achievementCount: friend.badge_count || 0,
          badgeCount: friend.badge_count || 0,
          isFriend: true,
          dogs: friend.primary_dog_id ? [{
            id: friend.primary_dog_id,
            name: friend.primary_dog_name || 'Unknown',
            breed: friend.primary_dog_breed || '',
            photo_url: friend.primary_dog_photo_url
          }] : [],
          territoryPolygons: []
        };
        
        // Load territory visualization data
        const friendWithTerritories = await loadFriendTerritoryData(friendData);
        return friendWithTerritories;
      }));
      
      setFriends(processedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };
  
  // Load territory visualization data for a friend
  const loadFriendTerritoryData = async (friend: User): Promise<User> => {
    try {
      // Skip if friend has no dogs
      if (!friend.dogs || friend.dogs.length === 0) {
        return friend;
      }
      
      const territoryPolygons: User['territoryPolygons'] = [];
      
      // Process each dog's territory
      for (const dog of friend.dogs) {
        if (!dog || !dog.id) continue;
        
        // Get walk points for this dog
        const { data: walkPoints, error: pointsError } = await supabase
          .from('walk_points')
          .select('id, path_coordinates')
          .eq('dog_id', dog.id);
          
        if (pointsError) {
          console.error(`Error fetching walk points for dog ${dog.id}:`, pointsError);
          continue;
        }
        
        if (!walkPoints || walkPoints.length === 0) {
          continue;
        }
        
        // Get color for this friend
        const color = await getFriendTerritoryColor(friend.id);
        
        // Process each walk point to create territory polygons
        for (const point of walkPoints) {
          if (point.path_coordinates && point.path_coordinates.length >= 3) {
            // Get coordinates from path_coordinates JSON
            const coordinates = point.path_coordinates as Coordinate[];
            
            // Create convex hull
            const hull = createConvexHull(coordinates);
            if (!hull) continue;
            
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
            
            // Add to territory polygons
            territoryPolygons.push({
              id: point.id,
              coordinates: hull,
              color,
              dogId: dog.id,
              dogName: dog.name,
              dogPhotoURL: dog.photo_url,
              dogBreed: dog.breed,
              centroid
            });
          }
        }
      }
      
      // Return updated friend with territory data
      return {
        ...friend,
        territoryPolygons
      };
    } catch (error) {
      console.error(`Error loading territory data for friend ${friend.id}:`, error);
      return friend;
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
      
      if (!requests || requests.length === 0) {
        setFriendRequests([]);
        return;
      }
      
      // Extract requester IDs
      const requesterIds = requests.map(request => request.requester_id);
      
      // Fetch all requesters' data in a single query
      const { data: requestersData, error: requestersError } = await supabase
        .from('public_user_stats')
        .select('*')
        .in('id', requesterIds);
        
      if (requestersError) {
        console.error('Error fetching requesters data:', requestersError);
        return;
      }
      
      // Map requests to FriendRequest objects
      const requestsData: FriendRequest[] = requests.map(request => {
        const requesterProfile = requestersData?.find(profile => profile.id === request.requester_id);
        
        if (!requesterProfile) {
          return {
            id: request.id,
            senderId: request.requester_id,
            senderName: 'Unknown User',
            senderDogName: 'Unknown Dog',
            timestamp: request.created_at,
            status: request.status
          };
        }
        
        return {
          id: request.id,
          senderId: request.requester_id,
          senderName: `${requesterProfile.first_name || ''} ${requesterProfile.last_name || ''}`.trim() || 'User',
          senderDogName: requesterProfile.primary_dog_name || 'No dog',
          senderPhotoURL: requesterProfile.avatar_url,
          timestamp: request.created_at,
          status: request.status,
          senderDogs: requesterProfile.primary_dog_id ? [{
            id: requesterProfile.primary_dog_id,
            name: requesterProfile.primary_dog_name || 'Unknown',
            breed: requesterProfile.primary_dog_breed || '',
            photo_url: requesterProfile.primary_dog_photo_url
          }] : []
        };
      });

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
      // Search profiles using the public_user_stats view
      const { data: searchResults, error } = await supabase
        .from('public_user_stats')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,primary_dog_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }
      
      if (!searchResults || searchResults.length === 0) {
        return [];
      }
      
      // Check friendship status for each result
      const friendshipChecks = await Promise.all(
        searchResults.map(async (profile) => {
          // Check if already friends or request exists
          const { data: existingRelation } = await supabase
            .from('friendships')
            .select('status, requester_id, receiver_id')
            .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${user.id})`)
            .maybeSingle();
            
          const isFriend = existingRelation?.status === 'accepted';
          const requestSent = existingRelation?.status === 'pending' && existingRelation?.requester_id === user.id;
          
          return {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
            dogName: profile.primary_dog_name || 'No dog',
            dogBreed: profile.primary_dog_breed || '',
            photoURL: profile.avatar_url,
            territorySize: profile.territory_size || 0,
            totalDistance: profile.total_distance || 0,
            achievementCount: profile.badge_count || 0,
            badgeCount: profile.badge_count || 0,
            isFriend,
            requestSent,
            dogs: profile.primary_dog_id ? [{
              id: profile.primary_dog_id,
              name: profile.primary_dog_name || 'Unknown',
              breed: profile.primary_dog_breed || '',
              photo_url: profile.primary_dog_photo_url
            }] : []
          };
        })
      );

      return friendshipChecks;
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