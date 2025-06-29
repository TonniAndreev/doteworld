/*
  # Fix walk_points and walk_sessions relationship

  1. Changes
    - Clarify the relationship between walk_points and walk_sessions tables
    - Remove ambiguous foreign key constraints
    - Establish a single clear relationship between the tables
    - Fix the session_id column to avoid confusion with walk_session_id

  2. Security
    - No changes to existing RLS policies
*/

-- First, check if we have both session_id and walk_session_id columns
DO $$
DECLARE
  has_session_id boolean;
  has_walk_session_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'session_id'
  ) INTO has_session_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'walk_session_id'
  ) INTO has_walk_session_id;
  
  -- If both columns exist, we need to consolidate
  IF has_session_id AND has_walk_session_id THEN
    -- Drop the foreign key constraints first
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'walk_points_session_id_fkey'
    ) THEN
      ALTER TABLE walk_points DROP CONSTRAINT walk_points_session_id_fkey;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'walk_points_walk_session_id_fkey'
    ) THEN
      ALTER TABLE walk_points DROP CONSTRAINT walk_points_walk_session_id_fkey;
    END IF;
    
    -- Drop the session_id column (the redundant one)
    ALTER TABLE walk_points DROP COLUMN session_id;
    
    -- Ensure walk_session_id has the correct foreign key
    ALTER TABLE walk_points
    ADD CONSTRAINT walk_points_walk_session_id_fkey
    FOREIGN KEY (walk_session_id)
    REFERENCES walk_sessions(id)
    ON DELETE CASCADE;
  END IF;
  
  -- If only session_id exists, rename it to walk_session_id for consistency
  IF has_session_id AND NOT has_walk_session_id THEN
    -- Drop the foreign key constraint first
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'walk_points_session_id_fkey'
    ) THEN
      ALTER TABLE walk_points DROP CONSTRAINT walk_points_session_id_fkey;
    END IF;
    
    -- Rename the column
    ALTER TABLE walk_points RENAME COLUMN session_id TO walk_session_id;
    
    -- Add the foreign key constraint with the new name
    ALTER TABLE walk_points
    ADD CONSTRAINT walk_points_walk_session_id_fkey
    FOREIGN KEY (walk_session_id)
    REFERENCES walk_sessions(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_walk_points_walk_session_id ON walk_points(walk_session_id);

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_walk_points_session_id;