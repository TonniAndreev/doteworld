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
      loadData();
    }
  }, [user]);

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

        // Get friend's first dog
        const { data: dogData } = await supabase
          .from('profile_dogs')
          .select(`
            dogs (
              name,
              breed
            )
          `)
          .eq('profile_id', friendId)
          .limit(1);

        const firstDog = dogData?.[0]?.dogs;

        // Get friend's achievement count
        const { count: achievementCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', friendId);

        friendsData.push({
          id: friendId,
          name: `${friendProfile.first_name || ''} ${friendProfile.last_name || ''}`.trim() || 'User',
          dogName: firstDog?.name || 'No dog',
          dogBreed: firstDog?.breed || '',
          photoURL: friendProfile.avatar_url,
          territorySize: Math.random() * 5, // Mock data - replace with real calculation
          totalDistance: Math.random() * 50, // Mock data - replace with real calculation
          achievementCount: achievementCount || 0,
          isFriend: true,
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

        // Get requester's first dog
        const { data: dogData } = await supabase
          .from('profile_dogs')
          .select(`
            dogs (
              name
            )
          `)
          .eq('profile_id', request.requester_id)
          .limit(1);

        const firstDog = dogData?.[0]?.dogs;

        requestsData.push({
          id: request.id,
          senderId: request.requester_id,
          senderName: `${requesterProfile.first_name || ''} ${requesterProfile.last_name || ''}`.trim() || 'User',
          senderDogName: firstDog?.name || 'No dog',
          senderPhotoURL: requesterProfile.avatar_url,
          timestamp: request.created_at,
          status: request.status,
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
          .select('status')
          .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${user.id})`)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no relation exists

        // Get user's first dog
        const { data: dogData } = await supabase
          .from('profile_dogs')
          .select(`
            dogs (
              name,
              breed
            )
          `)
          .eq('profile_id', profile.id)
          .limit(1);

        const firstDog = dogData?.[0]?.dogs;

        // Get achievement count
        const { count: achievementCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        searchResults.push({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          dogName: firstDog?.name || 'No dog',
          dogBreed: firstDog?.breed || '',
          photoURL: profile.avatar_url,
          territorySize: Math.random() * 5, // Mock data - replace with real calculation
          totalDistance: Math.random() * 50, // Mock data - replace with real calculation
          achievementCount: achievementCount || 0,
          isFriend: existingRelation?.status === 'accepted',
          requestSent: existingRelation?.status === 'pending',
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
      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
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
      // Refresh friend requests
      await fetchFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error removing friend:', error);
        return;
      }

      console.log('Friend removed successfully');
      // Refresh friends list
      await fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
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
    refetch: loadData,
  };
}