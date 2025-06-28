import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '@/utils/supabase';

export interface Notification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'achievement' | 'territory' | 'dog_invite';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  data?: {
    senderId?: string;
    senderName?: string;
    senderPhotoURL?: string;
    friendshipId?: string;
    achievementId?: string;
    territorySize?: number;
    dogId?: string;
    inviteId?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const channelsRef = useRef<{[key: string]: any}>({});
  const isInitializedRef = useRef(false);

  // Clean up function to remove all channels
  const cleanupChannels = () => {
    console.log('Cleaning up notification channels');
    Object.values(channelsRef.current).forEach(channel => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      }
    });
    channelsRef.current = {};
  };

  useEffect(() => {
    console.log('NotificationContext: User changed, user ID:', user?.id);
    
    // Always clean up existing channels first
    cleanupChannels();
    
    if (user?.id) {
      // Set up real-time listeners for various notifications
      setupNotificationListeners();
      
      // Load existing notifications
      loadNotifications();
      
      isInitializedRef.current = true;
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      isInitializedRef.current = false;
    }

    // Clean up on unmount or when user changes
    return cleanupChannels;
  }, [user?.id]); // Only re-run when user ID changes

  const setupNotificationListeners = () => {
    if (!user?.id) return;
    
    console.log('Setting up notification listeners for user:', user.id);
    
    try {
      // Set up friend requests channel
      channelsRef.current.friendships = supabase
        .channel('friendships-notifications-' + user.id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'friendships',
            filter: `receiver_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('New friendship notification:', payload);
            await handleFriendshipNotification(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'friendships',
            filter: `requester_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Friendship status update:', payload);
            if (payload.new.status === 'accepted') {
              await handleFriendAcceptedNotification(payload.new);
            }
          }
        )
        .subscribe();

      // Set up dog ownership invites channel
      channelsRef.current.dogInvites = supabase
        .channel('dog-invites-notifications-' + user.id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dog_ownership_invites',
            filter: `invitee_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('New dog invite notification:', payload);
            await handleDogInviteNotification(payload.new);
          }
        )
        .subscribe();

      // Set up achievements channel
      channelsRef.current.achievements = supabase
        .channel('achievements-notifications-' + user.id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profile_achievements',
            filter: `profile_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('New achievement notification:', payload);
            await handleAchievementNotification(payload.new);
          }
        )
        .subscribe();
        
      console.log('Notification channels set up successfully');
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      // For now, we'll use local storage for notifications
      // In a production app, you'd want to store these in the database
      const storedNotifications = await import('@react-native-async-storage/async-storage').then(
        async (AsyncStorage) => {
          const stored = await AsyncStorage.default.getItem(`notifications_${user.id}`);
          return stored ? JSON.parse(stored) : [];
        }
      );

      setNotifications(storedNotifications);
      setUnreadCount(storedNotifications.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async (newNotifications: Notification[]) => {
    if (!user?.id) return;

    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem(
        `notifications_${user.id}`,
        JSON.stringify(newNotifications)
      );
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const handleFriendshipNotification = async (friendship: any) => {
    try {
      // Get sender's profile
      const { data: senderProfile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', friendship.requester_id)
        .single();

      if (error || !senderProfile) {
        console.error('Error fetching sender profile:', error);
        return;
      }

      const senderName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || 'Someone';

      const notification: Notification = {
        id: `friend_request_${friendship.id}`,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${senderName} sent you a friend request`,
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          senderId: friendship.requester_id,
          senderName,
          senderPhotoURL: senderProfile.avatar_url,
          friendshipId: friendship.id,
        },
      };

      addNotification(notification);
    } catch (error) {
      console.error('Error handling friendship notification:', error);
    }
  };

  const handleFriendAcceptedNotification = async (friendship: any) => {
    try {
      // Get receiver's profile (the person who accepted)
      const { data: receiverProfile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', friendship.receiver_id)
        .single();

      if (error || !receiverProfile) {
        console.error('Error fetching receiver profile:', error);
        return;
      }

      const receiverName = `${receiverProfile.first_name || ''} ${receiverProfile.last_name || ''}`.trim() || 'Someone';

      const notification: Notification = {
        id: `friend_accepted_${friendship.id}`,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${receiverName} accepted your friend request`,
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          senderId: friendship.receiver_id,
          senderName: receiverName,
          senderPhotoURL: receiverProfile.avatar_url,
          friendshipId: friendship.id,
        },
      };

      addNotification(notification);
    } catch (error) {
      console.error('Error handling friend accepted notification:', error);
    }
  };

  const handleDogInviteNotification = async (invite: any) => {
    try {
      // Get inviter's profile and dog name
      const [inviterResult, dogResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', invite.inviter_id)
          .single(),
        supabase
          .from('dogs')
          .select('name')
          .eq('id', invite.dog_id)
          .single()
      ]);

      const inviterProfile = inviterResult.data;
      const dog = dogResult.data;

      if (!inviterProfile || !dog) {
        console.error('Error fetching invite data');
        return;
      }

      const inviterName = `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || 'Someone';

      const notification: Notification = {
        id: `dog_invite_${invite.id}`,
        type: 'dog_invite',
        title: 'Dog Co-ownership Invite',
        message: `${inviterName} invited you to be a ${invite.role} of ${dog.name}`,
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          senderId: invite.inviter_id,
          senderName: inviterName,
          senderPhotoURL: inviterProfile.avatar_url,
          dogId: invite.dog_id,
          inviteId: invite.id,
        },
      };

      addNotification(notification);
    } catch (error) {
      console.error('Error handling dog invite notification:', error);
    }
  };

  const handleAchievementNotification = async (profileAchievement: any) => {
    try {
      // Get achievement details
      const { data: achievement, error } = await supabase
        .from('achievements')
        .select('title, description, icon_url')
        .eq('id', profileAchievement.achievement_id)
        .single();

      if (error || !achievement) {
        console.error('Error fetching achievement:', error);
        return;
      }

      const notification: Notification = {
        id: `achievement_${profileAchievement.achievement_id}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You earned the "${achievement.title}" badge`,
        read: false,
        timestamp: new Date().toISOString(),
        data: {
          achievementId: profileAchievement.achievement_id,
        },
      };

      addNotification(notification);
    } catch (error) {
      console.error('Error handling achievement notification:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: notification.id || `${notification.type}_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep only last 50 notifications
      saveNotifications(updated);
      return updated;
    });

    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId: string) => {
    if (!user?.id) return;
    
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    if (!user?.id) return;
    
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      saveNotifications(updated);
      return updated;
    });
    
    setUnreadCount(0);
  };

  const removeNotification = (notificationId: string) => {
    if (!user?.id) return;

    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const updated = prev.filter(notification => notification.id !== notificationId);
      saveNotifications(updated);
      
      // Update unread count if needed
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return updated;
    });
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
};