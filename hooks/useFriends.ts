import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
}

export function useFriends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Mock data - in a real app, this would fetch from your backend
      const mockFriends: User[] = [
        {
          id: '1',
          name: 'Sarah Miller',
          dogName: 'Luna',
          dogBreed: 'Golden Retriever',
          territorySize: 2.5,
          achievementCount: 15,
          totalDistance: 45.2,
          isFriend: true
        },
        {
          id: '2',
          name: 'John Walker',
          dogName: 'Max',
          dogBreed: 'German Shepherd',
          territorySize: 3.1,
          achievementCount: 12,
          totalDistance: 38.7,
          isFriend: true
        },
        {
          id: '3',
          name: 'Emma Davis',
          dogName: 'Bella',
          dogBreed: 'Labrador',
          territorySize: 1.8,
          achievementCount: 8,
          totalDistance: 25.4,
          isFriend: true
        }
      ];

      const mockRequests: FriendRequest[] = [
        {
          id: '1',
          senderId: '4',
          senderName: 'Michael Brown',
          senderDogName: 'Rocky',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: '2',
          senderId: '5',
          senderName: 'Lisa Anderson',
          senderDogName: 'Charlie',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        }
      ];

      setFriends(mockFriends);
      setFriendRequests(mockRequests);
      setIsLoading(false);
    }
  }, [user]);

  const searchUsers = (query: string) => {
    if (!query.trim()) return [];

    // Mock user search results
    const mockSearchResults: User[] = [
      {
        id: '6',
        name: 'David Wilson',
        dogName: 'Cooper',
        dogBreed: 'Beagle',
        territorySize: 1.2,
        achievementCount: 5,
        totalDistance: 15.8
      },
      {
        id: '7',
        name: 'Rachel Green',
        dogName: 'Bailey',
        dogBreed: 'Poodle',
        territorySize: 0.8,
        achievementCount: 3,
        totalDistance: 10.2
      }
    ].filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.dogName.toLowerCase().includes(query.toLowerCase())
    );

    return mockSearchResults;
  };

  const sendFriendRequest = async (userId: string) => {
    // Mock sending friend request
    // In a real app, this would make an API call
    console.log('Friend request sent to:', userId);
  };

  const acceptFriendRequest = async (requestId: string) => {
    // Mock accepting friend request
    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    
    // Add the user to friends list
    const request = friendRequests.find(req => req.id === requestId);
    if (request) {
      const newFriend: User = {
        id: request.senderId,
        name: request.senderName,
        dogName: request.senderDogName,
        dogBreed: 'Unknown', // In a real app, we'd have this info
        territorySize: 0,
        achievementCount: 0,
        totalDistance: 0,
        isFriend: true
      };
      setFriends(prev => [...prev, newFriend]);
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    // Mock declining friend request
    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
  };

  return {
    friends,
    friendRequests,
    isLoading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest
  };
}