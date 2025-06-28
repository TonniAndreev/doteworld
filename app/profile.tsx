import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CreditCard as Edit } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePaws } from '@/contexts/PawsContext';
import { useTerritory } from '@/contexts/TerritoryContext';
import * as ImagePicker from 'expo-image-picker';
import StatsCard from '@/components/profile/StatsCard';
import BadgesRow from '@/components/profile/BadgesRow';
import AchievementsRow from '@/components/profile/AchievementsRow';
import DogProfileCard from '@/components/profile/DogProfileCard';
import DogOwnershipInvites from '@/components/dog/DogOwnershipInvites';

export default function ProfileScreen() {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  
  const { user, logout, updateUserProfilePhoto } = useAuth();
  const { pawsBalance } = usePaws();
  const { territorySize, totalDistance } = useTerritory();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to upload photos.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setIsUploadingPhoto(true);
      
      try {
        console.log('Uploading profile photo for user:', user?.id);
        const uploadResult = await updateUserProfilePhoto(result.assets[0].uri);
        
        if (uploadResult.success) {
          Alert.alert('Success', 'Profile photo updated successfully!');
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload photo');
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        Alert.alert('Error', 'Failed to upload photo');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user.avatar_url || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handlePhotoUpload}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Edit size={16} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.first_name} {user.last_name}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <StatsCard
            title="Paws Balance"
            value={pawsBalance.toString()}
            icon="💰"
          />
          <StatsCard
            title="Territory"
            value={`${territorySize.toFixed(1)} km²`}
            icon="🗺️"
          />
          <StatsCard
            title="Distance"
            value={`${totalDistance.toFixed(1)} km`}
            icon="🚶"
          />
        </View>
      </View>

      <BadgesRow />
      <AchievementsRow />
      <DogProfileCard />
      
      <DogOwnershipInvites 
        visible={showInvites}
        onClose={() => setShowInvites(false)}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.white + '80',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});