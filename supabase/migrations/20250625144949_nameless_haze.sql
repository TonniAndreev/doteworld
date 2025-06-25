/*
  # Add birthday field to dogs table

  1. Changes
    - Add `birthday` column to dogs table
    - Add `bio` column for dog description
    - Add `weight` column for dog weight
    - Add `gender` column for dog gender

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add new columns to dogs table
DO $$
BEGIN
  -- Add birthday column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'birthday'
  ) THEN
    ALTER TABLE dogs ADD COLUMN birthday date;
  END IF;

  -- Add bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'bio'
  ) THEN
    ALTER TABLE dogs ADD COLUMN bio text DEFAULT '';
  END IF;

  -- Add weight column (in kg)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'weight'
  ) THEN
    ALTER TABLE dogs ADD COLUMN weight decimal(5,2);
  END IF;

  -- Add gender column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'gender'
  ) THEN
    ALTER TABLE dogs ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'unknown')) DEFAULT 'unknown';
  END IF;
END $$;