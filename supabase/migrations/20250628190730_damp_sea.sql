/*
  # Storage buckets for dog photos and avatars

  1. New Buckets
    - `dog_photos` - For storing dog profile photos
    - `avatars` - For storing user profile avatars
  
  2. Configuration
    - Both buckets are public
    - 5MB file size limit
    - Allowed MIME types: jpeg, png, webp, gif
  
  3. Security
    - RLS policies for upload, view, update, and delete operations
*/

-- Create dog_photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog_photos', 'dog_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set file size limits and allowed MIME types for dog_photos
UPDATE storage.buckets 
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'dog_photos';

-- Set file size limits and allowed MIME types for avatars
UPDATE storage.buckets 
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

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