/*
  # Create Storage Buckets for Photos

  1. New Buckets
    - `dog-photos`: For storing dog profile pictures
    - `avatars`: For storing user profile pictures
  
  2. Security
    - Enable public access to both buckets
    - Set up RLS policies for proper access control
    - Allow users to manage their own files
    - Allow public read access to all files
*/

-- Create dog-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket  
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for dog-photos: Allow authenticated users to upload photos
CREATE POLICY "Users can upload dog photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dog-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for dog-photos: Allow public read access
CREATE POLICY "Public can view dog photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'dog-photos');

-- Policy for dog-photos: Allow users to update their own photos
CREATE POLICY "Users can update their dog photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'dog-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'dog-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for dog-photos: Allow users to delete their own photos
CREATE POLICY "Users can delete their dog photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'dog-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for avatars: Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
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
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for avatars: Allow users to delete their own avatars
CREATE POLICY "Users can delete their avatars" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);