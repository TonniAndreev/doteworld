/*
  # Fix Photo Upload Functionality

  1. Changes
    - Add photo_url column to dogs table if it doesn't exist
    - Add photo_uploaded_at timestamp to track when photos were uploaded
    - Create storage buckets if they don't exist
    - Add proper RLS policies for storage access

  2. Security
    - Ensure proper access control for uploaded files
    - Allow users to access their own files
*/

-- Add photo_url column to dogs table if it doesn't exist
DO $$
BEGIN
  -- Add photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE dogs ADD COLUMN photo_url text;
  END IF;

  -- Add photo_uploaded_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_uploaded_at'
  ) THEN
    ALTER TABLE dogs ADD COLUMN photo_uploaded_at timestamptz;
  END IF;
END $$;

-- Create index for better performance when querying by photo_url
CREATE INDEX IF NOT EXISTS idx_dogs_photo_url ON dogs(photo_url);

-- Create storage buckets if they don't exist
-- Note: This is a comment only as storage buckets must be created via the Supabase dashboard
-- or using the Supabase CLI. The following buckets should be created:
-- 1. avatars - For user profile photos
-- 2. dog-photos - For dog profile photos

-- Create or replace storage access policies
-- Note: These would normally be created via the Supabase dashboard
-- For avatars bucket:
-- - Allow authenticated users to upload their own avatars
-- - Allow public read access to all avatars
-- For dog-photos bucket:
-- - Allow authenticated users to upload photos for their dogs
-- - Allow public read access to all dog photos