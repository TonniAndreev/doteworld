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

      console.log('Fetching photo for dog:', dogId);

      // Fetch dog profile to get photo_path or photo_url
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .select('photo_path, photo_url, photo_uploaded_at')
        .eq('id', dogId)
        .single();

      if (dogError) {
        console.error('Error fetching dog profile:', dogError);
        setError(dogError.message);
        return;
      }

      if (dog?.photo_path) {
        console.log('Found photo_path:', dog.photo_path, 'Last updated:', dog.photo_uploaded_at);
        
        // Get public URL from Supabase Storage
        const publicUrl = getDogProfilePhotoUrl(dog.photo_path);
        
        // Add cache-busting parameter to the URL
        if (publicUrl && dog.photo_uploaded_at) {
          const timestamp = new Date(dog.photo_uploaded_at).getTime();
          const urlWithTimestamp = `${publicUrl}?t=${timestamp}`;
          console.log('Using URL with timestamp:', urlWithTimestamp);
          setPhotoUrl(urlWithTimestamp);
        } else {
          console.log('Using basic URL:', publicUrl);
          setPhotoUrl(publicUrl);
        }
      } else if (dog?.photo_url) {
        // Fallback to legacy photo_url
        console.log('Falling back to photo_url:', dog.photo_url);
        setPhotoUrl(dog.photo_url);
      } else {
        console.log('No photo found for dog');
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
    
    // Use a clean subscription approach
    const channel = supabase.channel(channelName);
    
    const subscription = channel
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
        console.log(`Dog photo channel ${channelName} status: ${status}`);
      });
    
    // Return cleanup function to unsubscribe
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dogId]); // Only re-run when dogId changes

  return {
    photoUrl,
    isLoading,
    error,
    refetch: fetchPhoto,
  };
}