import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Settings, LogOut } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <User size={32} color={COLORS.primary} />
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <User size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.nameText}>
            {user?.displayName || 'Dog Walker'}
          </Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Distance</Text>
            <Text style={styles.statValue}>45.2 km</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Territory Claimed</Text>
            <Text style={styles.statValue}>2.5 km²</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Achievements</Text>
            <Text style={styles.statValue}>8</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={20} color={COLORS.neutralDark} />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  emailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
  statsSection: {
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: 16,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 8,
  },
});