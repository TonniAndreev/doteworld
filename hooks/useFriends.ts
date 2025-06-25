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

  // --- fetchers ---
  const fetchFriends = async () => {
    if (!user) return;

    const { data: friendships, error: fErr } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        receiver_id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey(
          id, first_name, last_name, avatar_url
        ),
        receiver:profiles!friendships_receiver_id_fkey(
          id, first_name, last_name, avatar_url
        )
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (fErr) {
      console.error('Error fetching friends:', fErr);
      return;
    }

    const friendsData: User[] = [];
    for (const fr of friendships || []) {
      const prof = fr.requester_id === user.id ? fr.receiver : fr.requester;
      if (!prof) continue;

      // вземаме първото куче
      const { data: dogRows } = await supabase
        .from('profile_dogs')
        .select('dogs(name,breed)')
        .eq('profile_id', prof.id)
        .limit(1);
      const firstDog = dogRows?.[0]?.dogs;

      // броим постиженията
      const { count: achCount } = await supabase
        .from('profile_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', prof.id);

      friendsData.push({
        id: prof.id,
        name: `${prof.first_name} ${prof.last_name}`.trim(),
        dogName: firstDog?.name || 'No dog',
        dogBreed: firstDog?.breed || '',
        photoURL: prof.avatar_url,
        territorySize: 0,        // може да изчислиш по-късно
        totalDistance: 0,        // idem
        achievementCount: achCount ?? 0,
        isFriend: true,
      });
    }
    setFriends(friendsData);
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    const { data: reqs, error: rErr } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey(
          id, first_name, last_name, avatar_url
        )
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (rErr) {
      console.error('Error fetching friend requests:', rErr);
      return;
    }

    const requestsData: FriendRequest[] = [];
    for (const r of reqs || []) {
      if (!r.requester) continue;

      // вземаме първото им куче
      const { data: d } = await supabase
        .from('profile_dogs')
        .select('dogs(name)')
        .eq('profile_id', r.requester.id)
        .limit(1);
      const firstDog = d?.[0]?.dogs;

      requestsData.push({
        id: r.id,
        senderId: r.requester.id,
        senderName: `${r.requester.first_name} ${r.requester.last_name}`.trim(),
        senderDogName: firstDog?.name || 'No dog',
        senderPhotoURL: r.requester.avatar_url,
        timestamp: r.created_at,
        status: r.status,
      });
    }
    setFriendRequests(requestsData);
  };

  // --- effects ---
  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  // --- actions ---
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!user || !query.trim()) return [];

    const { data: profiles, error: sErr } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        profile_dogs!inner(dogs(name,breed))
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .neq('id', user.id)
      .limit(20);

    if (sErr) {
      console.error('Error searching users:', sErr);
      return [];
    }

    const results: User[] = [];
    for (const p of profiles || []) {
      const { data: rel } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${p.id}),and(requester_id.eq.${p.id},receiver_id.eq.${user.id})`)
        .single();

      const firstDog = (p.profile_dogs as any)?.[0]?.dogs;
      const achCountResp = await supabase
        .from('profile_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', p.id);

      results.push({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        dogName: firstDog?.name || 'No dog',
        dogBreed: firstDog?.breed || '',
        photoURL: p.avatar_url,
        territorySize: 0,
        totalDistance: 0,
        achievementCount: achCountResp.count ?? 0,
        isFriend: rel?.status === 'accepted',
        requestSent: rel?.status === 'pending',
      });
    }

    return results;
  };

  const sendFriendRequest = async (userId: string) => { /* … както си го имаш */ };
  const acceptFriendRequest = async (requestId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    await Promise.all([fetchFriends(), fetchFriendRequests()]);
  };
  const declineFriendRequest = async (requestId: string) => {
    await supabase.from('friendships').update({ status: 'rejected' }).eq('id', requestId);
    await fetchFriendRequests();
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
