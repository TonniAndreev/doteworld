/*
  # Refactor walk_points table

  1. Changes
    - Remove redundant latitude, longitude columns
    - Change walk_session_id to UUID type with foreign key constraint
    - Ensure proper data integrity with foreign key constraints
    - Maintain path_coordinates JSONB column for storing all coordinates
*/

-- Alter walk_points table to remove old columns and change walk_session_id type
DO $$
BEGIN
  -- Remove latitude column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE walk_points DROP COLUMN latitude;
  END IF;

  -- Remove longitude column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE walk_points DROP COLUMN longitude;
  END IF;

  -- Remove timestamp column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE walk_points DROP COLUMN "timestamp";
  END IF;

  -- Change walk_session_id to UUID type if it's not already
  -- This assumes that existing walk_session_id values (if any) are valid UUIDs.
  -- If not, you might need to clean or migrate data before this step.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'walk_session_id' AND data_type = 'text'
  ) THEN
    ALTER TABLE walk_points ALTER COLUMN walk_session_id TYPE uuid USING walk_session_id::uuid;
  END IF;
END $$;

-- Add foreign key constraint to walk_sessions table
-- This assumes the walk_sessions table already exists and has an 'id' column of type uuid.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'walk_points_walk_session_id_fkey'
  ) THEN
    ALTER TABLE walk_points
    ADD CONSTRAINT walk_points_walk_session_id_fkey
    FOREIGN KEY (walk_session_id) REFERENCES walk_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;