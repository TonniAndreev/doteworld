import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationPreferencesScreen() {
  const { preferences, updatePushNotificationStatus, updateEmailNotificationStatus } = useNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Notification Settings</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.globalSettings}>
          <View style={styles.globalSettingItem}>
            <View style={styles.settingInfo}>
              <Bell size={24} color={COLORS.primary} />
              <Text style={styles.settingTitle}>Push Notifications</Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={(value) => updatePushNotificationStatus(value)}
              trackColor={{ false: COLORS.neutralLight, true: COLORS.primaryLight }}
              thumbColor={preferences.pushEnabled ? COLORS.primary : COLORS.neutralMedium}
            />
          </View>
          
          <View style={styles.globalSettingItem}>
            <View style={styles.settingInfo}>
              <Bell size={24} color={COLORS.secondary} />
              <Text style={styles.settingTitle}>Email Notifications</Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={(value) => updateEmailNotificationStatus(value)}
              trackColor={{ false: COLORS.neutralLight, true: COLORS.primaryLight }}
              thumbColor={preferences.emailEnabled ? COLORS.primary : COLORS.neutralMedium}
            />
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <Text style={styles.sectionDescription}>
          Choose which notifications you want to receive
        </Text>
        
        <NotificationPreferences />
      </ScrollView>
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
    padding: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  globalSettings: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  globalSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 12,
  },
  divider: {
    height: 8,
    backgroundColor: COLORS.neutralExtraLight,
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginHorizontal: 16,
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
});