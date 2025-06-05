import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationsButton() {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity style={styles.container}>
      <Bell size={24} color={COLORS.neutralDark} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
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
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.white,
  },
});