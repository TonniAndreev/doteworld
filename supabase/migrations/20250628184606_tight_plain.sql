/*
  # Create dog-photos storage bucket

  1. Storage Setup
    - Create `dog-photos` bucket for storing dog profile photos
    - Configure bucket to be public for easy photo access
    - Set up appropriate file size and type restrictions

  2. Security Policies
    - Allow authenticated users to upload photos
    - Allow public read access to photos
    - Allow users to update/delete photos for dogs they own
    - Restrict file types to common image formats
    - Set reasonable file size limits
*/

-- Create the dog-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-photos',
  'dog-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload dog photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dog-photos' AND
  auth.uid() IS NOT NULL
);

-- Policy: Allow public read access to dog photos
CREATE POLICY "Public can view dog photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dog-photos');

-- Policy: Allow users to update photos for dogs they own
CREATE POLICY "Users can update photos for their dogs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dog-photos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profile_dogs pd
    WHERE pd.profile_id = auth.uid()
    AND pd.dog_id::text = (storage.foldername(name))[1]
    AND (pd.permissions->>'edit')::boolean = true
  )
);

-- Policy: Allow users to delete photos for dogs they own
CREATE POLICY "Users can delete photos for their dogs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dog-photos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profile_dogs pd
    WHERE pd.profile_id = auth.uid()
    AND pd.dog_id::text = (storage.foldername(name))[1]
    AND (pd.permissions->>'delete')::boolean = true
  )
);