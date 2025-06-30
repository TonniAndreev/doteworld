import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '@/utils/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  data?: any;
}

export interface NotificationPreferences {
  user: {
    friend_request: boolean;
    friend_accepted: boolean;
    dog_ownership: boolean;
    walk_reminder: boolean;
    vet_appointment: boolean;
  };
  achievement: {
    badge_earned: boolean;
    territory_milestone: boolean;
    walking_goal: boolean;
  };
  social: {
    friend_photo: boolean;
    comment: boolean;
    dog_birthday: boolean;
  };
  system: {
    app_update: boolean;
    safety_alert: boolean;
    announcement: boolean;
  };
  pushEnabled: boolean;
  emailEnabled: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreferences;
  isUpdatingPreferences: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  updatePreferences: (category: string, type: string, enabled: boolean) => void;
  updatePushNotificationStatus: (enabled: boolean) => void;
  updateEmailNotificationStatus: (enabled: boolean) => void;
  refreshNotifications: () => Promise<void>;
  scheduleLocalNotification: (title: string, body: string, data?: any, trigger?: any) => Promise<string>;
  cancelScheduledNotification: (notificationId: string) => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  user: {
    friend_request: true,
    friend_accepted: true,
    dog_ownership: true,
    walk_reminder: true,
    vet_appointment: true,
  },
  achievement: {
    badge_earned: true,
    territory_milestone: true,
    walking_goal: true,
  },
  social: {
    friend_photo: true,
    comment: true,
    dog_birthday: true,
  },
  system: {
    app_update: true,
    safety_alert: true,
    announcement: true,
  },
  pushEnabled: true,
  emailEnabled: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [pushPermission, setPushPermission] = useState<boolean>(false);
  
  const { user } = useAuth();
  
  // Use refs to track subscription status
  const friendshipSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const dogInviteSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const achievementSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const notificationSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const notificationResponseListener = useRef<any>();

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });

    // Listen for notification responses
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification } = response;
      const data = notification.request.content.data;
      
      // Handle notification tap
      if (data.notificationId) {
        markAsRead(data.notificationId);
      }
      
      // Handle specific actions based on notification type
      if (data.type === 'friend_request') {
        // Navigate to friends screen
      } else if (data.type === 'achievement') {
        // Navigate to achievements screen
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, []);

  // Load notification preferences
  useEffect(() => {
    if (user) {
      loadNotificationPreferences();
    }
  }, [user]);

  // Set up real-time listeners when user is logged in
  useEffect(() => {
    if (user) {
      // Clean up any existing subscriptions before creating new ones
      cleanupSubscriptions();
      
      // Create unique channel names that include the user ID and timestamp to avoid conflicts
      const friendshipsChannelName = `friendships-${user.id}-${Date.now()}`;
      const dogInvitesChannelName = `dog-invites-${user.id}-${Date.now()}`;
      const achievementsChannelName = `achievements-${user.id}-${Date.now()}`;
      const notificationsChannelName = `notifications-${user.id}-${Date.now()}`;
      
      console.log(`Creating notification channels for user ${user.id}`);
      
      // Set up real-time listener for friend requests
      friendshipSubscriptionRef.current = supabase
        .channel(friendshipsChannelName)
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
        .subscribe((status) => {
          console.log(`Subscription status for ${friendshipsChannelName}:`, status);
        });

      // Set up listener for dog ownership invites
      dogInviteSubscriptionRef.current = supabase
        .channel(dogInvitesChannelName)
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
        .subscribe((status) => {
          console.log(`Subscription status for ${dogInvitesChannelName}:`, status);
        });

      // Set up listener for achievements
      achievementSubscriptionRef.current = supabase
        .channel(achievementsChannelName)
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
        .subscribe((status) => {
          console.log(`Subscription status for ${achievementsChannelName}:`, status);
        });
        
      // Set up listener for notifications table
      notificationSubscriptionRef.current = supabase
        .channel(notificationsChannelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('New notification from database:', payload);
            await handleDatabaseNotification(payload.new);
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${notificationsChannelName}:`, status);
        });

      // Load existing notifications
      loadNotifications();

      return () => {
        // Clean up subscriptions when component unmounts
        cleanupSubscriptions();
      };
    }
  }, [user?.id]); // Only re-run if user ID changes
  
  const cleanupSubscriptions = () => {
    // Clean up any existing subscriptions
    if (friendshipSubscriptionRef.current) {
      console.log('Removing friendship subscription channel');
      supabase.removeChannel(friendshipSubscriptionRef.current);
      friendshipSubscriptionRef.current = null;
    }
    if (dogInviteSubscriptionRef.current) {
      console.log('Removing dog invite subscription channel');
      supabase.removeChannel(dogInviteSubscriptionRef.current);
      dogInviteSubscriptionRef.current = null;
    }
    if (achievementSubscriptionRef.current) {
      console.log('Removing achievement subscription channel');
      supabase.removeChannel(achievementSubscriptionRef.current);
      achievementSubscriptionRef.current = null;
    }
    if (notificationSubscriptionRef.current) {
      console.log('Removing notifications subscription channel');
      supabase.removeChannel(notificationSubscriptionRef.current);
      notificationSubscriptionRef.current = null;
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // First try to load from Supabase
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error loading notifications from database:', error);
        // Fall back to local storage
        await loadFromLocalStorage();
      } else if (dbNotifications && dbNotifications.length > 0) {
        console.log(`Loaded ${dbNotifications.length} notifications from database`);
        
        // Format notifications to match our interface
        const formattedNotifications: Notification[] = dbNotifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: notification.read,
          timestamp: notification.created_at,
          data: notification.data
        }));
        
        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        
        // Also update local storage as backup
        await AsyncStorage.setItem(
          `notifications_${user.id}`,
          JSON.stringify(formattedNotifications)
        );
      } else {
        // No notifications in database, try local storage
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      await loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFromLocalStorage = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem(`notifications_${user?.id}`);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter((n: Notification) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading notifications from local storage:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const loadNotificationPreferences = async () => {
    if (!user) return;

    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        console.log('No preferences found in database, checking local storage');
        
        // Try to load from local storage
        const storedPreferences = await AsyncStorage.getItem(`notification_preferences_${user.id}`);
        
        if (storedPreferences) {
          const parsedPreferences = JSON.parse(storedPreferences);
          setPreferences(parsedPreferences);
        } else {
          // No preferences found, use defaults and save them
          setPreferences(defaultPreferences);
          await saveNotificationPreferences(defaultPreferences);
        }
      } else {
        // Format database preferences to match our interface
        const formattedPreferences: NotificationPreferences = {
          user: {
            friend_request: data.user_friend_request,
            friend_accepted: data.user_friend_accepted,
            dog_ownership: data.user_dog_ownership,
            walk_reminder: data.user_walk_reminder,
            vet_appointment: data.user_vet_appointment,
          },
          achievement: {
            badge_earned: data.achievement_badge_earned,
            territory_milestone: data.achievement_territory_milestone,
            walking_goal: data.achievement_walking_goal,
          },
          social: {
            friend_photo: data.social_friend_photo,
            comment: data.social_comment,
            dog_birthday: data.social_dog_birthday,
          },
          system: {
            app_update: data.system_app_update,
            safety_alert: data.system_safety_alert,
            announcement: data.system_announcement,
          },
          pushEnabled: data.push_enabled,
          emailEnabled: data.email_enabled,
        };
        
        setPreferences(formattedPreferences);
        
        // Also update local storage as backup
        await AsyncStorage.setItem(
          `notification_preferences_${user.id}`,
          JSON.stringify(formattedPreferences)
        );
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setPreferences(defaultPreferences);
    }
  };

  const saveNotificationPreferences = async (newPreferences: NotificationPreferences) => {
    if (!user) return;

    try {
      setIsUpdatingPreferences(true);
      
      // Save to database
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          user_friend_request: newPreferences.user.friend_request,
          user_friend_accepted: newPreferences.user.friend_accepted,
          user_dog_ownership: newPreferences.user.dog_ownership,
          user_walk_reminder: newPreferences.user.walk_reminder,
          user_vet_appointment: newPreferences.user.vet_appointment,
          achievement_badge_earned: newPreferences.achievement.badge_earned,
          achievement_territory_milestone: newPreferences.achievement.territory_milestone,
          achievement_walking_goal: newPreferences.achievement.walking_goal,
          social_friend_photo: newPreferences.social.friend_photo,
          social_comment: newPreferences.social.comment,
          social_dog_birthday: newPreferences.social.dog_birthday,
          system_app_update: newPreferences.system.app_update,
          system_safety_alert: newPreferences.system.safety_alert,
          system_announcement: newPreferences.system.announcement,
          push_enabled: newPreferences.pushEnabled,
          email_enabled: newPreferences.emailEnabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error saving notification preferences to database:', error);
      }
      
      // Also save to local storage as backup
      await AsyncStorage.setItem(
        `notification_preferences_${user.id}`,
        JSON.stringify(newPreferences)
      );
      
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  const saveNotifications = async (newNotifications: Notification[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
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

      // Check if user has enabled this notification type
      if (preferences.user.friend_request) {
        addNotification(notification);
        
        // Send push notification if enabled
        if (preferences.pushEnabled && expoPushToken) {
          await scheduleLocalNotification(
            notification.title,
            notification.message,
            {
              type: notification.type,
              notificationId: notification.id,
              ...notification.data
            }
          );
        }
      }
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

      // Check if user has enabled this notification type
      if (preferences.user.friend_accepted) {
        addNotification(notification);
        
        // Send push notification if enabled
        if (preferences.pushEnabled && expoPushToken) {
          await scheduleLocalNotification(
            notification.title,
            notification.message,
            {
              type: notification.type,
              notificationId: notification.id,
              ...notification.data
            }
          );
        }
      }
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
          dogName: dog.name,
          inviteId: invite.id,
        },
      };

      // Check if user has enabled this notification type
      if (preferences.user.dog_ownership) {
        addNotification(notification);
        
        // Send push notification if enabled
        if (preferences.pushEnabled && expoPushToken) {
          await scheduleLocalNotification(
            notification.title,
            notification.message,
            {
              type: notification.type,
              notificationId: notification.id,
              ...notification.data
            }
          );
        }
      }
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
          achievementTitle: achievement.title,
          achievementDescription: achievement.description,
          achievementIconUrl: achievement.icon_url,
        },
      };

      // Check if user has enabled this notification type
      if (preferences.achievement.badge_earned) {
        addNotification(notification);
        
        // Send push notification if enabled
        if (preferences.pushEnabled && expoPushToken) {
          await scheduleLocalNotification(
            notification.title,
            notification.message,
            {
              type: notification.type,
              notificationId: notification.id,
              ...notification.data
            }
          );
        }
      }
    } catch (error) {
      console.error('Error handling achievement notification:', error);
    }
  };
  
  const handleDatabaseNotification = async (dbNotification: any) => {
    try {
      // Format notification to match our interface
      const notification: Notification = {
        id: dbNotification.id,
        type: dbNotification.type,
        title: dbNotification.title,
        message: dbNotification.message,
        read: dbNotification.read,
        timestamp: dbNotification.created_at,
        data: dbNotification.data
      };
      
      // Add to local state
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n.id === notification.id);
        if (exists) return prev;
        
        const updated = [notification, ...prev];
        saveNotifications(updated);
        return updated;
      });
      
      // Update unread count
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Send push notification if enabled and applicable
      const shouldSendPush = shouldSendPushNotification(notification.type);
      if (preferences.pushEnabled && expoPushToken && shouldSendPush) {
        await scheduleLocalNotification(
          notification.title,
          notification.message,
          {
            type: notification.type,
            notificationId: notification.id,
            ...notification.data
          }
        );
      }
    } catch (error) {
      console.error('Error handling database notification:', error);
    }
  };
  
  const shouldSendPushNotification = (type: string): boolean => {
    // Check if this notification type is enabled in preferences
    switch (type) {
      case 'friend_request':
        return preferences.user.friend_request;
      case 'friend_accepted':
        return preferences.user.friend_accepted;
      case 'dog_invite':
      case 'dog_ownership':
      case 'alpha_transfer':
        return preferences.user.dog_ownership;
      case 'walk_reminder':
        return preferences.user.walk_reminder;
      case 'vet_appointment':
        return preferences.user.vet_appointment;
      case 'achievement':
      case 'badge_earned':
        return preferences.achievement.badge_earned;
      case 'territory_milestone':
        return preferences.achievement.territory_milestone;
      case 'walking_goal':
        return preferences.achievement.walking_goal;
      case 'friend_photo':
      case 'photo_upload':
        return preferences.social.friend_photo;
      case 'comment':
        return preferences.social.comment;
      case 'dog_birthday':
        return preferences.social.dog_birthday;
      case 'app_update':
      case 'update':
        return preferences.system.app_update;
      case 'safety_alert':
        return preferences.system.safety_alert;
      case 'announcement':
      case 'system':
        return preferences.system.announcement;
      default:
        return true; // Default to showing notifications for unknown types
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if (!user) return;
    
    try {
      const newNotification: Notification = {
        ...notification,
        id: notification.id || `${notification.type}_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      
      // Try to save to database first
      const { error } = await supabase
        .from('notifications')
        .insert({
          id: newNotification.id,
          user_id: user.id,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          read: newNotification.read,
          data: newNotification.data,
          created_at: newNotification.timestamp
        });
      
      if (error) {
        console.error('Error saving notification to database:', error);
      }
      
      // Update local state
      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, 50); // Keep only last 50 notifications
        saveNotifications(updated);
        return updated;
      });
      
      // Update unread count
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error marking notification as read in database:', error);
      }
      
      // Update local state
      setNotifications(prev => {
        const updated = prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        );
        saveNotifications(updated);
        return updated;
      });
      
      // Update unread count
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all notifications as read in database:', error);
      }
      
      // Update local state
      setNotifications(prev => {
        const updated = prev.map(notification => ({ ...notification, read: true }));
        saveNotifications(updated);
        return updated;
      });
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error removing notification from database:', error);
      }
      
      // Update local state
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const updated = prev.filter(notification => notification.id !== notificationId);
        saveNotifications(updated);
        
        // Update unread count if needed
        if (notification && !notification.read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };
  
  const updatePreferences = async (category: string, type: string, enabled: boolean) => {
    if (!user) return;
    
    try {
      // Create a deep copy of current preferences
      const newPreferences = JSON.parse(JSON.stringify(preferences));
      
      // Update the specific preference
      if (newPreferences[category] && type in newPreferences[category]) {
        newPreferences[category][type] = enabled;
        
        // Save the updated preferences
        await saveNotificationPreferences(newPreferences);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };
  
  const updatePushNotificationStatus = async (enabled: boolean) => {
    if (!user) return;
    
    try {
      // Create a deep copy of current preferences
      const newPreferences = JSON.parse(JSON.stringify(preferences));
      
      // Update push notification status
      newPreferences.pushEnabled = enabled;
      
      // Save the updated preferences
      await saveNotificationPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating push notification status:', error);
    }
  };
  
  const updateEmailNotificationStatus = async (enabled: boolean) => {
    if (!user) return;
    
    try {
      // Create a deep copy of current preferences
      const newPreferences = JSON.parse(JSON.stringify(preferences));
      
      // Update email notification status
      newPreferences.emailEnabled = enabled;
      
      // Save the updated preferences
      await saveNotificationPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating email notification status:', error);
    }
  };
  
  const refreshNotifications = async () => {
    await loadNotifications();
  };
  
  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data: any = {},
    trigger: any = null
  ): Promise<string> => {
    try {
      // Schedule the notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: trigger || null, // null means send immediately
      });
      
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return '';
    }
  };
  
  const cancelScheduledNotification = async (notificationId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    isUpdatingPreferences,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    updatePreferences,
    updatePushNotificationStatus,
    updateEmailNotificationStatus,
    refreshNotifications,
    scheduleLocalNotification,
    cancelScheduledNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
};

// Function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web platform');
    return undefined;
  }
  
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Push notification token:', token);
  } else {
    console.log('Must use physical device for push notifications');
  }

  return token;
}