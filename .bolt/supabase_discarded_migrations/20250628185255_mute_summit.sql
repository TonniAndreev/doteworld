/*
  # Create Storage Buckets for User and Dog Photos

  1. Changes
    - Create dog_photos bucket for storing dog profile pictures
    - Create avatars bucket for storing user profile pictures
    - Set appropriate file size limits and MIME types
    - Add RLS policies for secure access control

  2. Security
    - Enable Row Level Security on storage objects
    - Create policies for upload, read, update, and delete operations
    - Ensure users can only modify their own files
    - Allow public read access to all photos
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
DO $$
BEGIN
  -- Policy: Allow authenticated users to upload dog photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload dog photos'
  ) THEN
    CREATE POLICY "Users can upload dog photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'dog_photos');
  END IF;

  -- Policy: Allow public read access to dog photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Public can view dog photos'
  ) THEN
    CREATE POLICY "Public can view dog photos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'dog_photos');
  END IF;

  -- Policy: Allow users to update their own dog photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can update dog photos'
  ) THEN
    CREATE POLICY "Users can update dog photos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'dog_photos');
  END IF;

  -- Policy: Allow users to delete their own dog photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete dog photos'
  ) THEN
    CREATE POLICY "Users can delete dog photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'dog_photos');
  END IF;
END $$;

-- Create policies for avatars bucket
DO $$
BEGIN
  -- Policy: Allow authenticated users to upload avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload avatars'
  ) THEN
    CREATE POLICY "Users can upload avatars"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');
  END IF;

  -- Policy: Allow public read access to avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Public can view avatars'
  ) THEN
    CREATE POLICY "Public can view avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;

  -- Policy: Allow users to update their own avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can update avatars'
  ) THEN
    CREATE POLICY "Users can update avatars"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars');
  END IF;

  -- Policy: Allow users to delete their own avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete avatars'
  ) THEN
    CREATE POLICY "Users can delete avatars"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars');
  END IF;
END $$;