import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { getDogProfilePhotoUrl } from '@/utils/photoStorage';
import { useSafeSubscription } from './useSafeSubscription';

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

  // Create a stable channel name without the timestamp
  const channelName = `dog_photo_${dogId}`;

  const fetchPhoto = async () => {
    if (!dogId) {
      setIsLoading(false);
      setPhotoUrl(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching photo for dog:', dogId);

      // Fetch dog profile to get photo_path or photo_url
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .select('photo_path, photo_uploaded_at')
        .eq('id', dogId)
        .maybeSingle();

      if (dogError && dogError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
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
      } else {
        console.log('No photo found for dog');
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error('Error in useDogProfilePhoto:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhotoUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dogId) {
      fetchPhoto();
    }
  }, [dogId]);
  
  // Use the safe subscription hook instead of direct channel creation
  useSafeSubscription(
    channelName,
    {
      event: 'UPDATE',
      table: 'dogs',
      filter: `id=eq.${dogId}`,
    },
    (payload) => {
      console.log('Dog photo updated:', payload);
      if (payload.new?.photo_uploaded_at !== payload.old?.photo_uploaded_at) {
        fetchPhoto();
      }
    },
    [dogId]
  );

  return {
    photoUrl,
    isLoading,
    error,
    refetch: fetchPhoto,
  };
}