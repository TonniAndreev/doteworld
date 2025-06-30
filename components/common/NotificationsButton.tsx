import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/notifications/NotificationBadge';

export default function NotificationsButton() {
  const { unreadCount } = useNotifications();

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Bell size={24} color={COLORS.neutralDark} />
      {unreadCount > 0 && (
        <NotificationBadge count={unreadCount} size="small" style={styles.badge} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});