import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { getUserProfilePhotoUrl } from '@/utils/photoStorage';
import { useSafeSubscription } from './useSafeSubscription';

interface UseUserProfilePhotoResult {
  photoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfilePhoto(userId?: string): UseUserProfilePhotoResult {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const targetUserId = userId || user?.id;

  // Create a unique subscription channel name with a timestamp to avoid collisions
  const channelName = `profile_photo_${targetUserId}_${Date.now()}`;

  const fetchPhoto = async () => {
    if (!targetUserId) {
      setIsLoading(false);
      setPhotoUrl(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching profile photo for user:', targetUserId);
      
      // Fetch user profile to get photo_path - force cache refresh with random param
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('photo_path, avatar_url, photo_uploaded_at')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error fetching user profile:', profileError);
        setError(profileError.message);
        return;
      }

      if (profile?.photo_path) {
        console.log('Found photo_path:', profile.photo_path, 'Last updated:', profile.photo_uploaded_at);
        
        // Get public URL from Supabase Storage
        const publicUrl = getUserProfilePhotoUrl(profile.photo_path);
        
        // Add cache-busting parameter to the URL
        if (publicUrl && profile.photo_uploaded_at) {
          const timestamp = new Date(profile.photo_uploaded_at).getTime();
          const urlWithTimestamp = `${publicUrl}?t=${timestamp}`;
          console.log('Using URL with timestamp:', urlWithTimestamp);
          setPhotoUrl(urlWithTimestamp);
        } else {
          console.log('Using basic URL:', publicUrl);
          setPhotoUrl(publicUrl);
        }
      } else if (profile?.avatar_url) {
        // Fallback to legacy avatar_url
        console.log('Falling back to avatar_url:', profile.avatar_url);
        setPhotoUrl(profile.avatar_url);
      } else {
        console.log('No photo found for user');
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error('Error in useUserProfilePhoto:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhotoUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchPhoto();
    }
  }, [targetUserId]);
  
  // Set up real-time subscription for photo updates
  useSafeSubscription(
    channelName,
    {
      event: 'UPDATE',
      table: 'profiles',
      filter: `id=eq.${targetUserId}`,
    },
    (payload) => {
      console.log('Profile photo updated:', payload);
      if (payload.new?.photo_uploaded_at !== payload.old?.photo_uploaded_at) {
        fetchPhoto();
      }
    },
    [targetUserId]
  );

  return {
    photoUrl,
    isLoading,
    error,
    refetch: fetchPhoto,
  };
}