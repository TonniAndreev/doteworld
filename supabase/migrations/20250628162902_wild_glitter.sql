-- Fix SQL syntax errors in previous migrations and ensure proper storage setup

-- First make sure we have the storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profiles', 'profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'::text]),
  ('dog_profiles', 'dog_profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'::text])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'::text];

-- Make sure we have the necessary columns
DO $$
BEGIN
  -- For profiles table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'photo_path'
  ) THEN
    ALTER TABLE profiles ADD COLUMN photo_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'photo_uploaded_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN photo_uploaded_at timestamptz;
  END IF;

  -- For dogs table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_path'
  ) THEN
    ALTER TABLE dogs ADD COLUMN photo_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_uploaded_at'
  ) THEN
    ALTER TABLE dogs ADD COLUMN photo_uploaded_at timestamptz;
  END IF;
END $$;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow dog owners to upload dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow dog owners to update dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow dog owners to delete dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view dog profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload photos for their dogs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view photos of dogs they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can update photos for their dogs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos for their dogs" ON storage.objects;

-- Create new policies with proper syntax
-- Profiles bucket - insert policy
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Profiles bucket - select policy
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'profiles'
  );

-- Profiles bucket - update policy
CREATE POLICY "Users can update their own profile photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Profiles bucket - delete policy
CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Dog profiles bucket - insert policy
CREATE POLICY "Dog owners can upload dog photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dog_profiles' AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id::text = (storage.foldername(name))[1]
      AND pd.profile_id = auth.uid()
    )
  );

-- Dog profiles bucket - select policy
CREATE POLICY "Anyone can view dog photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'dog_profiles'
  );

-- Dog profiles bucket - update policy
CREATE POLICY "Dog owners can update dog photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dog_profiles' AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id::text = (storage.foldername(name))[1]
      AND pd.profile_id = auth.uid()
    )
  );

-- Dog profiles bucket - delete policy
CREATE POLICY "Dog owners can delete dog photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog_profiles' AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id::text = (storage.foldername(name))[1]
      AND pd.profile_id = auth.uid()
    )
  );