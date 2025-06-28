/*
  # Create Storage Buckets with Direct SQL

  1. New Storage Buckets
    - `dog_photos` - For storing dog profile pictures
    - `avatars` - For storing user profile avatars
  
  2. Security
    - Enable public access for both buckets
    - Set appropriate file size limits and MIME types
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
ON CONFLICT (id) DO NOTHING;

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for dog_photos bucket
CREATE POLICY "Anyone can upload dog photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'dog_photos');

CREATE POLICY "Public can view dog photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dog_photos');

CREATE POLICY "Anyone can update dog photos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'dog_photos');

CREATE POLICY "Anyone can delete dog photos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'dog_photos');

-- Create policies for avatars bucket
CREATE POLICY "Anyone can upload avatars"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'avatars');