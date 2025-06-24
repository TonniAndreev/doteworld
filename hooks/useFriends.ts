import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

interface User {
  id: string;
  name: string;
  dogName: string;
  dogBreed: string;
  photoURL?: string | null;
  territorySize: number;
  achievementCount: number;
  totalDistance: number;
  requestSent?: boolean;
  isFriend?: boolean;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderDogName: string;
  senderPhotoURL?: string | null;
  timestamp: string;
  status: string;
}

export function useFriends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Fetch accepted friendships where user is either requester or receiver
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          receiver_id,
          status,
          created_at,
          requester:profiles!friendships_requester_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          receiver:profiles!friendships_receiver_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }

      const friendsData: User[] = [];

      for (const friendship of friendships || []) {
        // Determine which profile is the friend (not the current user)
        const friendProfile = friendship.requester_id === user.id 
          ? friendship.receiver 
          : friendship.requester;

        if (friendProfile) {
          // Fetch friend's dogs
          const { data: friendDogs } = await supabase
            .from('profile_dogs')
            .select(`
              dogs (
                name,
                breed
              )
            `)
            .eq('profile_id', friendProfile.id)
            .limit(1);

          const firstDog = friendDogs?.[0]?.dogs;

          // Fetch friend's achievement count
          const { count: achievementCount } = await supabase
            .from('profile_achievements')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', friendProfile.id);

          friendsData.push({
            id: friendProfile.id,
            name: `${friendProfile.first_name} ${friendProfile.last_name}`.trim(),
            dogName: firstDog?.name || 'No dog',
            dogBreed: firstDog?.breed || '',
            photoURL: friendProfile.avatar_url,
            territorySize: 0, // This would be calculated from territory data
            achievementCount: achievementCount || 0,
            totalDistance: 0, // This would be calculated from walk data
            isFriend: true,
          });
        }
      }

      setFriends(friendsData);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      // Fetch pending friend requests where current user is the receiver
      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          status,
          created_at,
          requester:profiles!friendships_requester_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching friend requests:', error);
        return;
      }

      const requestsData: FriendRequest[] = [];

      for (const request of requests || []) {
        if (request.requester) {
          // Fetch requester's first dog
          const { data: requesterDogs } = await supabase
            .from('profile_dogs')
            .select(`
              dogs (
                name
              )
            `)
            .eq('profile_id', request.requester.id)
            .limit(1);

          const firstDog = requesterDogs?.[0]?.dogs;

          requestsData.push({
            id: request.id,
            senderId: request.requester.id,
            senderName: `${request.requester.first_name} ${request.requester.last_name}`.trim(),
            senderDogName: firstDog?.name || 'No dog',
            senderPhotoURL: request.requester.avatar_url,
            timestamp: request.created_at,
            status: request.status,
          });
        }
      }

      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = (query: string) => {
    if (!query.trim()) return [];

    // Implement user search
    return searchUsersInDatabase(query);
  };

  const searchUsersInDatabase = async (query: string): Promise<User[]> => {
    if (!user || !query.trim()) return [];

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          profile_dogs (
            dogs (
              name,
              breed
            )
          )
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq('id', user.id) // Exclude current user
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
          .select('status')
          .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${user.id})`)
          .single();

        const firstDog = profile.profile_dogs?.[0]?.dogs;
        const isFriend = existingRelation?.status === 'accepted';
        const requestSent = existingRelation?.status === 'pending';

        // Get achievement count
        const { count: achievementCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        searchResults.push({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          dogName: firstDog?.name || 'No dog',
          dogBreed: firstDog?.breed || '',
          photoURL: profile.avatar_url,
          territorySize: 0, // Would be calculated from territory data
          achievementCount: achievementCount || 0,
          totalDistance: 0, // Would be calculated from walk data
          isFriend,
          requestSent,
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
      const { data: existing, error: checkError } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`)
        .single();

      if (existing) {
        console.log('Friendship already exists with status:', existing.status);
        return;
      }

      // Create new friend request
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          receiver_id: userId,
          status: 'pending',
        });

      if (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }

      console.log('Friend request sent successfully');
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting friend request:', error);
        throw error;
      }

      // Refresh data
      await Promise.all([fetchFriends(), fetchFriendRequests()]);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining friend request:', error);
        throw error;
      }

      // Refresh data
      await fetchFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  };

  return {
    friends,
    friendRequests,
    isLoading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    refetch: () => Promise.all([fetchFriends(), fetchFriendRequests()]),
  };
}