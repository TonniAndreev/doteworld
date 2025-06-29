/*
  # Fix walk_points relationship with walk_sessions

  1. Changes
     - Drops the ambiguous foreign key constraints between walk_points and walk_sessions
     - Ensures walk_points.walk_session_id is the only foreign key to walk_sessions.id
     - Removes any redundant session_id column if it exists
  
  2. Security
     - No changes to RLS policies
*/

-- First, check if session_id column exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'walk_points' AND column_name = 'session_id'
  ) THEN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'walk_points' 
      AND ccu.column_name = 'session_id'
    ) THEN
      EXECUTE 'ALTER TABLE walk_points DROP CONSTRAINT IF EXISTS walk_points_session_id_fkey';
    END IF;
    
    -- Drop the column
    ALTER TABLE walk_points DROP COLUMN session_id;
  END IF;
END $$;

-- Ensure walk_session_id is the only foreign key to walk_sessions.id
-- First drop the constraint if it exists
ALTER TABLE walk_points DROP CONSTRAINT IF EXISTS walk_points_walk_session_id_fkey;

-- Then recreate it with a clear name
ALTER TABLE walk_points ADD CONSTRAINT walk_points_walk_session_id_fkey 
  FOREIGN KEY (walk_session_id) REFERENCES walk_sessions(id) ON DELETE CASCADE;

-- Make sure walk_session_id is not nullable
ALTER TABLE walk_points ALTER COLUMN walk_session_id SET NOT NULL;

-- Add an index on walk_session_id for better performance
CREATE INDEX IF NOT EXISTS idx_walk_points_walk_session_id ON walk_points(walk_session_id);