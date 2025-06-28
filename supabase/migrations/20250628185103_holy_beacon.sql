/*
  # Create Storage Buckets for User and Dog Photos

  1. Changes
    - Create 'dog_photos' bucket for storing dog profile images
    - Create 'avatars' bucket for storing user profile images
    - Set appropriate permissions and policies for both buckets
    - Configure file size limits and allowed MIME types

  2. Security
    - Enable public read access for all photos
    - Restrict uploads to authenticated users
    - Allow users to manage only their own files
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
    AND policyname = 'Authenticated users can upload dog photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload dog photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'dog_photos' AND
      auth.uid() IS NOT NULL
    );
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
    AND policyname = 'Users can update their dog photos'
  ) THEN
    CREATE POLICY "Users can update their dog photos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'dog_photos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Policy: Allow users to delete their own dog photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete their dog photos'
  ) THEN
    CREATE POLICY "Users can delete their dog photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'dog_photos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
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
    AND policyname = 'Authenticated users can upload avatars'
  ) THEN
    CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      auth.uid() IS NOT NULL
    );
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
    AND policyname = 'Users can update their avatars'
  ) THEN
    CREATE POLICY "Users can update their avatars"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Policy: Allow users to delete their own avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete their avatars'
  ) THEN
    CREATE POLICY "Users can delete their avatars"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;