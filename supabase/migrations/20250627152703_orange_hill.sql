/*
  # Fix dogs table structure

  1. Changes
    - Add updated_at column to dogs table
    - Add trigger to automatically update updated_at timestamp
    - Fix any missing columns or constraints

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data integrity
*/

-- Add updated_at column to dogs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dogs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE dogs ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON dogs;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON dogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();