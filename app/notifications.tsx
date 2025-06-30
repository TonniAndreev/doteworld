import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Trash2, Settings } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationList from '@/components/notifications/NotificationList';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    notifications, 
    markAllAsRead, 
    removeNotification,
    refreshNotifications,
    unreadCount
  } = useNotifications();

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: any) => {
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
      case 'dog_ownership':
      case 'alpha_transfer':
        // Navigate to profile screen where invites are shown
        router.push('/(tabs)/profile');
        break;
      case 'walk_reminder':
        // Navigate to map screen to start a walk
        router.push('/(tabs)');
        break;
      case 'vet_appointment':
        // Navigate to appointments screen (if it exists)
        Alert.alert('Vet Appointment', notification.message);
        break;
      case 'comment':
        // Navigate to the comment thread
        Alert.alert('Comment', notification.message);
        break;
      case 'photo_upload':
        // Navigate to the photo
        Alert.alert('New Photo', notification.message);
        break;
      case 'system':
      case 'app_update':
      case 'safety_alert':
      case 'announcement':
        // Show alert with system message
        Alert.alert(notification.title, notification.message);
        break;
      default:
        // Default behavior for unknown types
        Alert.alert(notification.title, notification.message);
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // Clear all notifications
            notifications.forEach(notification => {
              removeNotification(notification.id);
            });
          },
        },
      ]
    );
  };

  const handleOpenSettings = () => {
    router.push('/notification-preferences');
  };

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
        
        <View style={styles.headerButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleOpenSettings}
          >
            <Settings size={20} color={COLORS.neutralDark} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleClearAll}
          >
            <Trash2 size={20} color={COLORS.neutralDark} />
          </TouchableOpacity>
        </View>
      </View>

      <NotificationList
        onNotificationPress={handleNotificationPress}
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    marginRight: 12,
  },
  markAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
});