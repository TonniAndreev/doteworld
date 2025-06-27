import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ChevronLeft, 
  UserPlus, 
  UserCheck, 
  Award, 
  MapPin, 
  Crown,
  X,
  Check,
  MoreHorizontal
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useFriends } from '@/hooks/useFriends';
import UserAvatar from '@/components/common/UserAvatar';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotifications();
  const { acceptFriendRequest, declineFriendRequest } = useFriends();

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, you might refetch notifications here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'friend_request':
        // Navigate to friends screen or show friend request details
        router.push('/(tabs)/friends');
        break;
      case 'friend_accepted':
        // Navigate to friends screen
        router.push('/(tabs)/friends');
        break;
      case 'achievement':
        // Navigate to achievements screen
        router.push('/(tabs)/achievements');
        break;
      case 'territory':
        // Navigate to map screen
        router.push('/(tabs)');
        break;
      case 'dog_invite':
        // Navigate to profile screen where invites are shown
        router.push('/(tabs)/profile');
        break;
    }
  };

  const handleAcceptFriendRequest = async (notification: Notification) => {
    if (notification.data?.friendshipId) {
      await acceptFriendRequest(notification.data.friendshipId);
      removeNotification(notification.id);
    }
  };

  const handleDeclineFriendRequest = async (notification: Notification) => {
    if (notification.data?.friendshipId) {
      await declineFriendRequest(notification.data.friendshipId);
      removeNotification(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus size={24} color={COLORS.primary} />;
      case 'friend_accepted':
        return <UserCheck size={24} color={COLORS.success} />;
      case 'achievement':
        return <Award size={24} color={COLORS.accent} />;
      case 'territory':
        return <MapPin size={24} color={COLORS.secondary} />;
      case 'dog_invite':
        return <Crown size={24} color={COLORS.tertiary} />;
      default:
        return <MoreHorizontal size={24} color={COLORS.neutralMedium} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item: notification }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            {getNotificationIcon(notification.type)}
          </View>
          
          <View style={styles.notificationInfo}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.notificationTitle,
                !notification.read && styles.unreadTitle
              ]}>
                {notification.title}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(notification.timestamp)}
              </Text>
            </View>
            
            <Text style={styles.notificationMessage}>
              {notification.message}
            </Text>
          </View>

          {notification.data?.senderPhotoURL && (
            <UserAvatar
              userId={notification.data.senderId || 'unknown'}
              photoURL={notification.data.senderPhotoURL}
              userName={notification.data.senderName || 'User'}
              size={40}
            />
          )}
        </View>

        {/* Friend request action buttons */}
        {notification.type === 'friend_request' && !notification.read && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptFriendRequest(notification)}
            >
              <Check size={16} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineFriendRequest(notification)}
            >
              <X size={16} color={COLORS.error} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Notifications</Text>
        
        {notifications.some(n => !n.read) && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Award size={64} color={COLORS.neutralMedium} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              You'll see friend requests, achievements, and other updates here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: COLORS.primaryExtraLight,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutralExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontFamily: 'Inter-Bold',
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  notificationMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  acceptButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.white,
  },
  declineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  declineButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 8,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    transform: [{ translateY: -4 }],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
});