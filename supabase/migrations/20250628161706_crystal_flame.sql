-- Create storage buckets for profile and dog photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profiles', 'profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('dog_profiles', 'dog_profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies for profiles bucket
CREATE POLICY "Allow users to upload their own profile photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to update their own profile photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to delete their own profile photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow public to view profile photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'profiles'
  );

-- Create storage policies for dog_profiles bucket
CREATE POLICY "Allow dog owners to upload dog photos"
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

CREATE POLICY "Allow dog owners to update dog photos"
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

CREATE POLICY "Allow dog owners to delete dog photos"
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

CREATE POLICY "Allow public to view dog photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'dog_profiles'
  );

-- Add photo_path and photo_uploaded_at columns if they don't exist
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