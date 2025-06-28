import { supabase } from './supabase';

export interface PhotoUploadResult {
  success: boolean;
  photoPath?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload a user profile photo to Supabase Storage
 */
export async function uploadUserProfilePhoto(
  userId: string, 
  fileUri: string
): Promise<PhotoUploadResult> {
  try {
    console.log('Starting user profile photo upload...');
    
    // Generate unique filename
    const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;
    
    console.log(`Uploading to profiles/${fileName}`);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, {
        uri: fileUri, 
        type: `image/${fileExt}`, 
        name: `profile.${fileExt}`
      }, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading profile photo:', uploadError);
      return { success: false, error: uploadError.message };
    }

    console.log('Upload successful, getting public URL');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    console.log('Public URL:', urlData.publicUrl);

    // Update user profile with photo path
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        photo_path: fileName,
        photo_uploaded_at: new Date().toISOString(),
        avatar_url: urlData.publicUrl, // Keep for backward compatibility
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with photo path:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('Profile updated with new photo path');

    return {
      success: true,
      photoPath: fileName,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error in uploadUserProfilePhoto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Upload a dog profile photo to Supabase Storage
 */
export async function uploadDogProfilePhoto(
  dogId: string, 
  fileUri: string
): Promise<PhotoUploadResult> {
  try {
    console.log('Starting dog profile photo upload...');
    
    // Generate unique filename
    const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${dogId}/profile-${Date.now()}.${fileExt}`;
    
    console.log(`Uploading to dog_profiles/${fileName}`);
    
    // Upload to Supabase Storage - pass file object directly
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dog_profiles')
      .upload(fileName, {
        uri: fileUri, 
        type: `image/${fileExt}`, 
        name: `dog-profile.${fileExt}`
      }, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading dog photo:', uploadError);
      return { success: false, error: uploadError.message };
    }

    console.log('Upload successful, getting public URL');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('dog_profiles')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    console.log('Public URL:', urlData.publicUrl);

    // Update dog profile with photo path
    const { error: updateError } = await supabase
      .from('dogs')
      .update({
        photo_path: fileName,
        photo_uploaded_at: new Date().toISOString(),
        photo_url: urlData.publicUrl, // Keep for backward compatibility
      })
      .eq('id', dogId);

    if (updateError) {
      console.error('Error updating dog with photo path:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('Dog profile updated with new photo path');

    return {
      success: true,
      photoPath: fileName,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error in uploadDogProfilePhoto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get public URL for a user profile photo
 */
export function getUserProfilePhotoUrl(photoPath: string | null): string | null {
  if (!photoPath) return null;
  
  const { data } = supabase.storage
    .from('profiles')
    .getPublicUrl(photoPath);
    
  return data?.publicUrl || null;
}

/**
 * Get public URL for a dog profile photo
 */
export function getDogProfilePhotoUrl(photoPath: string | null): string | null {
  if (!photoPath) return null;
  
  const { data } = supabase.storage
    .from('dog_profiles')
    .getPublicUrl(photoPath);
    
  return data?.publicUrl || null;
}

/**
 * Delete a user profile photo from storage
 */
export async function deleteUserProfilePhoto(userId: string, photoPath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('profiles')
      .remove([photoPath]);

    if (error) {
      console.error('Error deleting profile photo:', error);
      return false;
    }

    // Clear photo path from profile
    await supabase
      .from('profiles')
      .update({
        photo_path: null,
        photo_uploaded_at: null,
        avatar_url: null,
      })
      .eq('id', userId);

    return true;
  } catch (error) {
    console.error('Error in deleteUserProfilePhoto:', error);
    return false;
  }
}

/**
 * Delete a dog profile photo from storage
 */
export async function deleteDogProfilePhoto(dogId: string, photoPath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('dog_profiles')
      .remove([photoPath]);

    if (error) {
      console.error('Error deleting dog photo:', error);
      return false;
    }

    // Clear photo path from dog profile
    await supabase
      .from('dogs')
      .update({
        photo_path: null,
        photo_uploaded_at: null,
        photo_url: null,
      })
      .eq('id', dogId);

    return true;
  } catch (error) {
    console.error('Error in deleteDogProfilePhoto:', error);
    return false;
  }
}