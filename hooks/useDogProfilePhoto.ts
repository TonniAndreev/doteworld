import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { getDogProfilePhotoUrl } from '@/utils/photoStorage';

interface UseDogProfilePhotoResult {
  photoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDogProfilePhoto(dogId: string): UseDogProfilePhotoResult {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoto = async () => {
    if (!dogId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch dog profile to get photo_path
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .select('photo_path, photo_url')
        .eq('id', dogId)
        .single();

      if (dogError) {
        console.error('Error fetching dog profile:', dogError);
        setError(dogError.message);
        return;
      }

      if (dog?.photo_path) {
        // Get public URL from Supabase Storage
        const publicUrl = getDogProfilePhotoUrl(dog.photo_path);
        setPhotoUrl(publicUrl);
      } else if (dog?.photo_url) {
        // Fallback to legacy photo_url
        setPhotoUrl(dog.photo_url);
      } else {
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error('Error in useDogProfilePhoto:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhoto();
  }, [dogId]);

  // Set up real-time subscription for photo updates
  useEffect(() => {
    if (!dogId) return;

    const channelName = `dog_photo_${dogId}`;
    
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
            table: 'dogs',
            filter: `id=eq.${dogId}`,
          },
          (payload) => {
            console.log('Dog photo updated:', payload);
            fetchPhoto();
          }
        )
        .subscribe((status) => {
          console.log(`Dog photo channel status: ${status}`);
        });
        
      // Return cleanup function to unsubscribe
      return () => {
        supabase.removeChannel(channel);
      };
    }

    // No cleanup needed if we're using existing channel
    return () => {};
  }, [dogId]); // Only re-run when dogId changes

  return {
    photoUrl,
    isLoading,
    error,
    refetch: fetchPhoto,
  };
}