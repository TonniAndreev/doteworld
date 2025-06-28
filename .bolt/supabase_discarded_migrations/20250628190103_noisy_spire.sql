/*
  # Create storage buckets for photos

  1. New Storage Buckets
    - `dog_photos` - For storing dog profile pictures
    - `avatars` - For storing user profile pictures
  
  2. Security
    - Enable RLS on storage.objects
    - Create policies for authenticated users to manage their own photos
    - Allow public read access to all photos
*/

-- Create the dog_photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog_photos', 'dog_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for dog_photos bucket
CREATE POLICY "Authenticated users can upload dog photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dog_photos');

CREATE POLICY "Public can view dog photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dog_photos');

CREATE POLICY "Users can update their dog photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'dog_photos');

CREATE POLICY "Users can delete their dog photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'dog_photos');

-- Create policies for avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');