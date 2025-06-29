/*
  # Fix dogs photo_url column issue

  1. Changes
    - Ensure photo_url column exists in dogs table
    - Add photo_uploaded_at timestamp column to track when photos were uploaded
    - Create index for better query performance

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add photo_url column if it doesn't exist
DO $$
BEGIN
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