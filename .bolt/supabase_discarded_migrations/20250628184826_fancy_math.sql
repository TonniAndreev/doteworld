-- Create storage buckets using storage.create_bucket function
SELECT storage.create_bucket('dog-photos', 'Dog Photos Storage');
SELECT storage.create_bucket('avatars', 'User Avatars Storage');

-- Set buckets to public
UPDATE storage.buckets SET public = true WHERE id IN ('dog-photos', 'avatars');

-- Create policies for dog-photos bucket
SELECT storage.create_policy(
  'dog-photos', 
  'Users can upload dog photos',
  'INSERT',
  'authenticated',
  'storage.foldername(name)[1] = auth.uid()::text'
);

SELECT storage.create_policy(
  'dog-photos', 
  'Public can view dog photos',
  'SELECT',
  'public',
  'true'
);

SELECT storage.create_policy(
  'dog-photos', 
  'Users can update their dog photos',
  'UPDATE',
  'authenticated',
  'storage.foldername(name)[1] = auth.uid()::text'
);

SELECT storage.create_policy(
  'dog-photos', 
  'Users can delete their dog photos',
  'DELETE',
  'authenticated',
  'storage.foldername(name)[1] = auth.uid()::text'
);

-- Create policies for avatars bucket
SELECT storage.create_policy(
  'avatars', 
  'Users can upload avatars',
  'INSERT',
  'authenticated',
  'storage.foldername(name)[1] = auth.uid()::text'
);

SELECT storage.create_policy(
  'avatars', 
  'Public can view avatars',
  'SELECT',
  'public',
  'true'
);

SELECT storage.create_policy(
  'avatars', 
  'Users can update their avatars',
  'UPDATE',
  'authenticated',
  'storage.foldername(name)[1] = auth.uid()::text'
);

SELECT storage.create_policy(
  'avatars', 
  'Users can delete their avatars',
  'DELETE',
  'authenticated',
  'storage.foldername(name)[1] = auth.uid()::text'
);