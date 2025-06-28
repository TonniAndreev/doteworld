/*
  # Add photo_url column to dogs table

  1. Changes
    - Add `photo_url` column to dogs table for storing dog photos
    - Update existing RLS policies to handle the new column

  2. Security
    - No changes to existing RLS policies needed
    - Column follows same access patterns as other dog data
*/

-- Add photo_url column to dogs table
DO $$
BEGIN
  -- Add photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE dogs ADD COLUMN photo_url text;
  END IF;
END $$;

-- Add index for better performance when querying by photo_url
CREATE INDEX IF NOT EXISTS idx_dogs_photo_url ON dogs(photo_url);