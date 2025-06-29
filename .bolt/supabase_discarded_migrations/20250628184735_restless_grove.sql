/*
  # Create Storage Buckets for Photos

  1. New Storage Buckets
    - `dog_photos` - For storing dog profile photos
    - `avatars` - For storing user profile photos
  
  2. Security
    - Enable RLS on storage buckets
    - Add policies for authenticated users to upload their own photos
    - Add policies for public read access to photos
*/

-- Create dog_photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog_photos', 'dog_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket  
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for dog_photos: Allow authenticated users to upload photos
CREATE POLICY "Users can upload dog photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dog_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for dog_photos: Allow public read access
CREATE POLICY "Public can view dog photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'dog_photos');

-- Policy for dog_photos: Allow users to update their own photos
CREATE POLICY "Users can update their dog photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'dog_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'dog_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for dog_photos: Allow users to delete their own photos
CREATE POLICY "Users can delete their dog photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'dog_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for avatars: Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for avatars: Allow public read access
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Policy for avatars: Allow users to update their own avatars
CREATE POLICY "Users can update their avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for avatars: Allow users to delete their own avatars
CREATE POLICY "Users can delete their avatars" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);