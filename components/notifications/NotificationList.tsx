import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator 
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { Bell } from 'lucide-react-native';
import NotificationItem from './NotificationItem';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationListProps {
  onNotificationPress: (notification: any) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function NotificationList({ 
  onNotificationPress, 
  refreshing = false, 
  onRefresh 
}: NotificationListProps) {
  const { notifications, markAsRead, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Bell size={64} color={COLORS.neutralMedium} />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyText}>
          You'll see friend requests, achievements, and other updates here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      renderItem={({ item }) => (
        <NotificationItem
          notification={item}
          onPress={() => onNotificationPress(item)}
          onMarkAsRead={() => markAsRead(item.id)}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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