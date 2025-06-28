/*
  # Create Storage Buckets for User and Dog Photos

  1. New Storage Buckets
    - `dog_photos` - For storing dog profile pictures
    - `avatars` - For storing user profile pictures
  
  2. Configuration
    - Both buckets are public (readable by anyone)
    - 5MB file size limit
    - Allowed MIME types: jpeg, png, webp, gif
  
  3. Security
    - Enable RLS on storage.objects
    - Create policies for upload, read, update, and delete operations
*/

-- Create the dog_photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog_photos',
  'dog_photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatars" ON storage.objects;

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