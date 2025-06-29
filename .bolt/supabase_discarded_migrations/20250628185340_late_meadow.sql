/*
  # Storage Buckets and Policies Setup

  1. New Storage Buckets
    - dog_photos: For storing dog profile images
    - avatars: For storing user profile images
    
  2. Security
    - Enable RLS on storage.objects
    - Create simplified policies for each bucket
    - Allow authenticated users to upload files
    - Allow public read access to all files
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

-- Create simplified policies for dog_photos bucket
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

  -- Policy: Allow authenticated users to update dog photos
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

  -- Policy: Allow authenticated users to delete dog photos
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

-- Create simplified policies for avatars bucket
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

  -- Policy: Allow authenticated users to update avatars
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

  -- Policy: Allow authenticated users to delete avatars
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