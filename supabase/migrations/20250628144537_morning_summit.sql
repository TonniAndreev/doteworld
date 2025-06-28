/*
  # Add Photo Storage Support

  1. Storage Setup
    - Create storage buckets for profiles and dog profiles
    - Set up proper RLS policies for bucket access

  2. Database Changes
    - Add photo_path and uploaded_at columns to profiles table
    - Add photo_path and uploaded_at columns to dogs table
    - Update existing RLS policies

  3. Security
    - Users can only access their own profile photos
    - Users can only access photos of dogs they own or have access to
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profiles', 'profiles', true),
  ('dog_profiles', 'dog_profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Add photo storage columns to profiles table
DO $$
BEGIN
  -- Add photo_path column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'photo_path'
  ) THEN
    ALTER TABLE profiles ADD COLUMN photo_path text;
  END IF;

  -- Add uploaded_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'photo_uploaded_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN photo_uploaded_at timestamptz;
  END IF;
END $$;

-- Add photo storage columns to dogs table
DO $$
BEGIN
  -- Add photo_path column (rename existing photo_url to photo_path)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_path'
  ) THEN
    ALTER TABLE dogs RENAME COLUMN photo_url TO photo_path;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_path'
  ) THEN
    ALTER TABLE dogs ADD COLUMN photo_path text;
  END IF;

  -- Add uploaded_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_uploaded_at'
  ) THEN
    ALTER TABLE dogs ADD COLUMN photo_uploaded_at timestamptz;
  END IF;
END $$;

-- Storage policies for profiles bucket
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own profile photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for dog_profiles bucket
CREATE POLICY "Users can upload photos for their dogs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dog_profiles' AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id::text = (storage.foldername(name))[1]
      AND pd.profile_id = auth.uid()
      AND (pd.permissions->>'edit')::boolean = true
    )
  );

CREATE POLICY "Users can view photos of dogs they have access to"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dog_profiles' AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id::text = (storage.foldername(name))[1]
      AND pd.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos for their dogs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dog_profiles' AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id::text = (storage.foldername(name))[1]
      AND pd.profile_id = auth.uid()
      AND (pd.permissions->>'edit')::boolean = true
    )
  );

CREATE POLICY "Users can delete photos for their dogs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog_profiles' AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id::text = (storage.foldername(name))[1]
      AND pd.profile_id = auth.uid()
      AND (pd.permissions->>'edit')::boolean = true
    )
  );

-- Allow public access to view profile photos
CREATE POLICY "Public can view profile photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profiles');

CREATE POLICY "Public can view dog profile photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dog_profiles');