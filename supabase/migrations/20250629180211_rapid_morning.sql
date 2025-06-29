/*
  # Add Monthly Territory Reset Support

  1. Changes
    - Add last_reset_month column to profiles table
    - Add monthly_territory_size column to profiles table
    - Add function to reset territories at the beginning of each month
    - Add trigger to update monthly territory size

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data integrity
*/

-- Add columns to profiles table
DO $$
BEGIN
  -- Add last_reset_month column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_reset_month'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_reset_month text;
  END IF;

  -- Add monthly_territory_size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_territory_size'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_territory_size numeric DEFAULT 0;
  END IF;
END $$;

-- Create function to reset territories at the beginning of each month
CREATE OR REPLACE FUNCTION reset_monthly_territories()
RETURNS TRIGGER AS $$
DECLARE
  current_month text;
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(now(), 'YYYY-MM');
  
  -- If this is a new month, reset the territory
  IF NEW.last_reset_month IS NULL OR NEW.last_reset_month != current_month THEN
    -- Store previous month's territory size in history table (if we had one)
    -- For now, just reset the monthly territory size
    NEW.monthly_territory_size := 0;
    NEW.last_reset_month := current_month;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset territories on profile update
DROP TRIGGER IF EXISTS reset_monthly_territories_trigger ON profiles;
CREATE TRIGGER reset_monthly_territories_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_territories();

-- Create trigger to reset territories on profile insert
DROP TRIGGER IF EXISTS reset_monthly_territories_insert_trigger ON profiles;
CREATE TRIGGER reset_monthly_territories_insert_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_territories();

-- Create function to update monthly territory size when walk sessions are completed
CREATE OR REPLACE FUNCTION update_monthly_territory_size()
RETURNS TRIGGER AS $$
DECLARE
  dog_owner_id uuid;
BEGIN
  -- Get the dog owner's profile ID
  SELECT profile_id INTO dog_owner_id
  FROM profile_dogs
  WHERE dog_id = NEW.dog_id
  AND role = 'owner'
  LIMIT 1;
  
  -- Update the owner's monthly territory size
  IF dog_owner_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE profiles
    SET monthly_territory_size = monthly_territory_size + NEW.territory_gained
    WHERE id = dog_owner_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update monthly territory size when walk sessions are completed
DROP TRIGGER IF EXISTS update_monthly_territory_size_trigger ON walk_sessions;
CREATE TRIGGER update_monthly_territory_size_trigger
  AFTER INSERT OR UPDATE ON walk_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_territory_size();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_reset_month ON profiles(last_reset_month);