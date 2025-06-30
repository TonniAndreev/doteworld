import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { 
  UserPlus, 
  UserCheck, 
  Award, 
  MapPin, 
  Crown, 
  Calendar, 
  Bell, 
  MessageSquare,
  Camera,
  AlertTriangle,
  Info
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import UserAvatar from '@/components/common/UserAvatar';
import { formatRelativeTime } from '@/utils/dateUtils';

export interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    data?: any;
  };
  onPress: () => void;
  onMarkAsRead?: () => void;
}

export default function NotificationItem({ notification, onPress, onMarkAsRead }: NotificationItemProps) {
  const getNotificationIcon = () => {
    switch (notification.type) {
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
      case 'dog_ownership':
        return <Crown size={24} color={COLORS.tertiary} />;
      case 'alpha_transfer':
        return <Crown size={24} color={COLORS.accent} />;
      case 'walk_reminder':
        return <Calendar size={24} color={COLORS.primary} />;
      case 'vet_appointment':
        return <Calendar size={24} color={COLORS.warning} />;
      case 'comment':
        return <MessageSquare size={24} color={COLORS.secondary} />;
      case 'photo_upload':
        return <Camera size={24} color={COLORS.tertiary} />;
      case 'system':
        return <Bell size={24} color={COLORS.neutralDark} />;
      case 'safety_alert':
        return <AlertTriangle size={24} color={COLORS.error} />;
      case 'update':
        return <Info size={24} color={COLORS.primary} />;
      default:
        return <Bell size={24} color={COLORS.neutralMedium} />;
    }
  };

  const handlePress = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead();
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unreadContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getNotificationIcon()}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[
            styles.title,
            !notification.read && styles.unreadTitle
          ]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(notification.timestamp)}
          </Text>
        </View>
        
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        
        {notification.data?.senderPhotoURL && (
          <View style={styles.senderContainer}>
            <UserAvatar
              userId={notification.data.senderId || 'unknown'}
              photoURL={notification.data.senderPhotoURL}
              userName={notification.data.senderName || 'User'}
              size={24}
            />
            <Text style={styles.senderName} numberOfLines={1}>
              {notification.data.senderName}
            </Text>
          </View>
        )}
      </View>
      
      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadContainer: {
    backgroundColor: COLORS.primaryExtraLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
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
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
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
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    lineHeight: 20,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  senderName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: 16,
    right: 16,
  },
});