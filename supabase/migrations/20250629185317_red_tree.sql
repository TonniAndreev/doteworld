/*
  # Add last_reset_month to profiles table
  
  1. Changes
     - Add last_reset_month column to profiles table to track monthly territory resets
     - Add index for better performance when querying by last_reset_month
  
  2. Purpose
     - This column will store the last month when a user's territory was reset
     - Format is YYYY-MM (e.g., "2025-06")
     - Used to determine if territories should be reset at the beginning of a new month
*/

-- Add last_reset_month column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_reset_month'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_reset_month TEXT;
  END IF;
END $$;

-- Create index for better performance when querying by last_reset_month
CREATE INDEX IF NOT EXISTS idx_profiles_last_reset_month ON profiles(last_reset_month);

-- Add comment explaining the column
COMMENT ON COLUMN profiles.last_reset_month IS 
'Stores the last month when a user''s territory was reset in YYYY-MM format (e.g., "2025-06")';