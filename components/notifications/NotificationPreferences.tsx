import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { UserPlus, Award, MapPin, Bell, Calendar, MessageSquare, Camera, TriangleAlert as AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationPreferences() {
  const { 
    preferences, 
    updatePreferences, 
    isUpdatingPreferences 
  } = useNotifications();
  
  const [expandedSections, setExpandedSections] = useState({
    user: true,
    achievement: true,
    social: true,
    system: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTogglePreference = (category: string, type: string, enabled: boolean) => {
    updatePreferences(category, type, enabled);
  };

  const renderPreferenceItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    category: string,
    type: string,
    enabled: boolean
  ) => (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceInfo}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          <Text style={styles.preferenceDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={(value) => handleTogglePreference(category, type, value)}
        trackColor={{ false: COLORS.neutralLight, true: COLORS.primaryLight }}
        thumbColor={enabled ? COLORS.primary : COLORS.neutralMedium}
        disabled={isUpdatingPreferences}
      />
    </View>
  );

  const renderSection = (
    title: string,
    sectionKey: string,
    items: React.ReactNode
  ) => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        {expandedSections[sectionKey as keyof typeof expandedSections] ? (
          <ChevronUp size={20} color={COLORS.neutralDark} />
        ) : (
          <ChevronDown size={20} color={COLORS.neutralDark} />
        )}
      </TouchableOpacity>
      
      {expandedSections[sectionKey as keyof typeof expandedSections] && (
        <View style={styles.sectionContent}>
          {items}
        </View>
      )}
    </View>
  );

  if (!preferences) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {isUpdatingPreferences && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.savingText}>Saving preferences...</Text>
        </View>
      )}
      
      {renderSection('User Notifications', 'user', (
        <>
          {renderPreferenceItem(
            <UserPlus size={20} color={COLORS.primary} />,
            'Friend Requests',
            'Receive notifications for new friend requests',
            'user',
            'friend_request',
            preferences.user.friend_request
          )}
          
          {renderPreferenceItem(
            <UserPlus size={20} color={COLORS.success} />,
            'Friend Accepted',
            'Get notified when someone accepts your friend request',
            'user',
            'friend_accepted',
            preferences.user.friend_accepted
          )}
          
          {renderPreferenceItem(
            <Crown size={20} color={COLORS.tertiary} />,
            'Dog Ownership',
            'Notifications about dog ownership invites and changes',
            'user',
            'dog_ownership',
            preferences.user.dog_ownership
          )}
          
          {renderPreferenceItem(
            <Calendar size={20} color={COLORS.primary} />,
            'Walk Reminders',
            'Reminders for scheduled dog walks',
            'user',
            'walk_reminder',
            preferences.user.walk_reminder
          )}
          
          {renderPreferenceItem(
            <Calendar size={20} color={COLORS.warning} />,
            'Vet Appointments',
            'Reminders for upcoming vet appointments',
            'user',
            'vet_appointment',
            preferences.user.vet_appointment
          )}
        </>
      ))}
      
      {renderSection('Achievement Notifications', 'achievement', (
        <>
          {renderPreferenceItem(
            <Award size={20} color={COLORS.accent} />,
            'New Badges',
            'Get notified when you earn new badges',
            'achievement',
            'badge_earned',
            preferences.achievement.badge_earned
          )}
          
          {renderPreferenceItem(
            <MapPin size={20} color={COLORS.secondary} />,
            'Territory Milestones',
            'Notifications for territory conquest milestones',
            'achievement',
            'territory_milestone',
            preferences.achievement.territory_milestone
          )}
          
          {renderPreferenceItem(
            <Award size={20} color={COLORS.primary} />,
            'Walking Goals',
            'Alerts when you complete walking goals',
            'achievement',
            'walking_goal',
            preferences.achievement.walking_goal
          )}
        </>
      ))}
      
      {renderSection('Social Notifications', 'social', (
        <>
          {renderPreferenceItem(
            <Camera size={20} color={COLORS.tertiary} />,
            'Friend Photos',
            'Get notified when friends upload new dog photos',
            'social',
            'friend_photo',
            preferences.social.friend_photo
          )}
          
          {renderPreferenceItem(
            <MessageSquare size={20} color={COLORS.secondary} />,
            'Comments',
            'Notifications when someone comments on your dog\'s profile',
            'social',
            'comment',
            preferences.social.comment
          )}
          
          {renderPreferenceItem(
            <Calendar size={20} color={COLORS.accent} />,
            'Dog Birthdays',
            'Reminders for your friends\' dogs\' birthdays',
            'social',
            'dog_birthday',
            preferences.social.dog_birthday
          )}
        </>
      ))}
      
      {renderSection('System Notifications', 'system', (
        <>
          {renderPreferenceItem(
            <Info size={20} color={COLORS.primary} />,
            'App Updates',
            'Get notified about new app features and updates',
            'system',
            'app_update',
            preferences.system.app_update
          )}
          
          {renderPreferenceItem(
            <AlertTriangle size={20} color={COLORS.error} />,
            'Safety Alerts',
            'Important safety alerts for dog owners in your area',
            'system',
            'safety_alert',
            preferences.system.safety_alert
          )}
          
          {renderPreferenceItem(
            <Bell size={20} color={COLORS.neutralDark} />,
            'General Announcements',
            'General announcements and news from Dote',
            'system',
            'announcement',
            preferences.system.announcement
          )}
        </>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: 16,
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
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  savingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.white,
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.neutralExtraLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  sectionContent: {
    padding: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutralExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  preferenceTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  preferenceDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
});