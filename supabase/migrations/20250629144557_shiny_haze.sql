/*
  # Fix Dog Photos Storage Policies

  1. Changes
    - Update storage policies for dog-photos bucket
    - Align policies with the correct folder structure (dogId/fileName)
    - Ensure proper permissions checking against profile_dogs table

  2. Security
    - Strengthen RLS policies for dog photo uploads
    - Ensure only users with proper permissions can manage dog photos
    - Fix path validation to use dog_id as the folder name
*/

-- Drop existing policies for dog-photos bucket
DROP POLICY IF EXISTS "Authenticated users can upload dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update photos for their dogs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos for their dogs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view dog photos" ON storage.objects;

-- Create new INSERT policy
-- This policy allows authenticated users to upload photos to a folder named after the dog_id
-- only if they have edit permissions for that dog
CREATE POLICY "Users can upload photos for their dogs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dog-photos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profile_dogs pd
    WHERE pd.profile_id = auth.uid()
    AND pd.dog_id::text = (storage.foldername(name))[1] -- Checks if folder name matches dog_id
    AND (pd.permissions->>'edit')::boolean = true
  )
);

-- Create new UPDATE policy
-- This policy allows authenticated users to update photos in a folder named after the dog_id
-- only if they have edit permissions for that dog
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
    AND pd.dog_id::text = (storage.foldername(name))[1] -- Checks if folder name matches dog_id
    AND (pd.permissions->>'edit')::boolean = true
  )
);

-- Create new DELETE policy
-- This policy allows authenticated users to delete photos from a folder named after the dog_id
-- only if they have delete permissions for that dog
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
    AND pd.dog_id::text = (storage.foldername(name))[1] -- Checks if folder name matches dog_id
    AND (pd.permissions->>'delete')::boolean = true
  )
);

-- Create new SELECT policy
-- This policy allows public read access to all dog photos
CREATE POLICY "Public can view dog photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dog-photos');