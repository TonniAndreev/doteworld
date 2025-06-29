import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getDogAvatarSource } from '@/utils/dogAvatarUtils';
import { prepareFileForUpload } from '@/utils/fileUtils';

interface DogPhotoUploaderProps {
  dogId: string;
  dogBreed: string;
  currentPhotoUrl: string | null;
  onPhotoUploaded: (photoUrl: string) => void;
}

export default function DogPhotoUploader({
  dogId,
  dogBreed,
  currentPhotoUrl,
  onPhotoUploaded,
}: DogPhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to select a photo.');
        return;
      }
      
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera permissions to take a photo.');
        return;
      }
      
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadPhoto = async (photoUri: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload photos.');
      return;
    }

    try {
      setIsUploading(true);
      
      // Generate a unique filename
      const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${dogId}/${fileName}`;
      
      console.log('Uploading to path:', filePath);
      
      // Prepare file for upload
      const { data: fileData } = await prepareFileForUpload(photoUri);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(filePath, fileData, {
          upsert: true,
        });
      
      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw new Error('Failed to upload dog photo');
      }
      
      console.log('Upload successful:', uploadData);
      
      // Get public URL
      const { data: publicUrlData } = await supabase.storage
        .from('dog-photos')
        .getPublicUrl(filePath);
      
      console.log('Public URL:', publicUrlData);
      
      // Update dog record with new photo URL
      const { error: updateError } = await supabase
        .from('dogs')
        .update({
          photo_url: publicUrlData.publicUrl,
          photo_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', dogId);

      if (updateError) {
        console.error('Error updating dog photo:', updateError);
        throw new Error('Failed to update dog photo');
      }

      // Call the callback with the new photo URL
      onPhotoUploaded(publicUrlData.publicUrl);
      
      Alert.alert('Success', 'Dog photo updated successfully!');
    } catch (error) {
      console.error('Error saving dog photo:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update dog photo');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!currentPhotoUrl) return;
    
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              
              // Update dog record to remove photo URL
              const { error: updateError } = await supabase
                .from('dogs')
                .update({
                  photo_url: null,
                  photo_uploaded_at: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', dogId);

              if (updateError) {
                console.error('Error updating dog record:', updateError);
                throw new Error('Failed to update dog record');
              }
              
              // Call the callback with null to indicate photo removal
              onPhotoUploaded(null);
              
              Alert.alert('Success', 'Photo removed successfully!');
            } catch (error) {
              console.error('Error removing photo:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove photo');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.photoContainer}>
        <Image 
          source={currentPhotoUrl ? { uri: currentPhotoUrl } : getDogAvatarSource(dogId, null, dogBreed)}
          style={styles.dogPhoto}
          resizeMode="cover"
        />
        
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.photoButton}
          onPress={takePhoto}
          disabled={isUploading}
        >
          <Camera size={20} color={COLORS.primary} />
          <Text style={styles.photoButtonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.photoButton}
          onPress={pickImage}
          disabled={isUploading}
        >
          <ImageIcon size={20} color={COLORS.primary} />
          <Text style={styles.photoButtonText}>Choose Photo</Text>
        </TouchableOpacity>
        
        {currentPhotoUrl && (
          <TouchableOpacity 
            style={[styles.photoButton, styles.removeButton]}
            onPress={removePhoto}
            disabled={isUploading}
          >
            <X size={20} color={COLORS.error} />
            <Text style={styles.removeButtonText}>Remove Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  dogPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.white,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  photoButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  removeButton: {
    backgroundColor: COLORS.errorLight,
  },
  removeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
  },
});