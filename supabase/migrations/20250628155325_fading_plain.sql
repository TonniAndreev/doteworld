/*
  # Create Storage Buckets and Policies

  1. New Storage Buckets
    - `profiles` - For user profile photos
    - `dog_profiles` - For dog profile photos

  2. Security Policies
    - Allow authenticated users to upload their own profile photos
    - Allow authenticated users to upload photos for dogs they own
    - Allow public read access to all photos
    - Allow users to delete their own photos

  3. Bucket Configuration
    - Set appropriate file size limits
    - Enable public access for reading
*/

-- Create profiles storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create dog_profiles storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog_profiles',
  'dog_profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Profiles bucket policies
CREATE POLICY "Allow authenticated users to upload profile photos"
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

CREATE POLICY "Allow public read access to profile photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profiles');

-- Dog profiles bucket policies
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
      AND ((pd.permissions ->> 'edit')::boolean = true)
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
      AND ((pd.permissions ->> 'edit')::boolean = true)
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
      AND ((pd.permissions ->> 'delete')::boolean = true)
    )
  );

CREATE POLICY "Allow public read access to dog photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dog_profiles');