import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { getUserProfilePhotoUrl } from '@/utils/photoStorage';

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

  const fetchPhoto = async () => {
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user profile to get photo_path
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('photo_path, avatar_url')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setError(profileError.message);
        return;
      }

      if (profile?.photo_path) {
        // Get public URL from Supabase Storage
        const publicUrl = getUserProfilePhotoUrl(profile.photo_path);
        setPhotoUrl(publicUrl);
      } else if (profile?.avatar_url) {
        // Fallback to legacy avatar_url
        setPhotoUrl(profile.avatar_url);
      } else {
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error('Error in useUserProfilePhoto:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhoto();
  }, [targetUserId]);

  // Set up real-time subscription for photo updates
  useEffect(() => {
    if (!targetUserId) return;

    const channelName = `profile_photo_${targetUserId}`;
    
    // Check if the channel already exists
    const existingChannel = supabase.getChannels().find(
      channel => channel.topic === channelName
    );
    
    if (!existingChannel) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${targetUserId}`,
          },
          (payload) => {
            console.log('Profile photo updated:', payload);
            fetchPhoto();
          }
        )
        .subscribe((status) => {
          console.log(`Profile photo channel status: ${status}`);
        });
        
      // Return cleanup function to unsubscribe
      return () => {
        supabase.removeChannel(channel);
      };
    }

    // No cleanup needed if we're using existing channel
    return () => {};
  }, [targetUserId]); // Only re-run when targetUserId changes

  return {
    photoUrl,
    isLoading,
    error,
    refetch: fetchPhoto,
  };
}