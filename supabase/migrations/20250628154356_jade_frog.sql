/*
  # Fix walk_sessions table and related functionality

  1. Changes
    - Create walk_sessions table if it doesn't exist
    - Add session_id column to walk_points if it doesn't exist
    - Create indexes for better performance
    - Enable RLS on walk_sessions
    - Create policies for walk_sessions with proper checks to avoid duplicates
    - Create function to update walk_sessions statistics
    - Create view for walk statistics

  2. Security
    - Enable RLS on walk_sessions
    - Add policies for proper access control
*/

-- Create walk_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS walk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  distance double precision DEFAULT 0,
  points_count integer DEFAULT 0,
  territory_gained double precision DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  weather_conditions jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add session_id column to walk_points if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE walk_points ADD COLUMN session_id uuid REFERENCES walk_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_walk_sessions_dog_id ON walk_sessions(dog_id);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_status ON walk_sessions(status);
CREATE INDEX IF NOT EXISTS idx_walk_points_session_id ON walk_points(session_id);

-- Enable RLS on walk_sessions
ALTER TABLE walk_sessions ENABLE ROW LEVEL SECURITY;

-- Check if policies already exist before creating them
DO $$
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_sessions' AND policyname = 'Users can insert their own walk sessions'
  ) THEN
    CREATE POLICY "Users can insert their own walk sessions"
      ON walk_sessions
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profile_dogs pd
          WHERE pd.dog_id = walk_sessions.dog_id
          AND pd.profile_id = auth.uid()
        )
      );
  END IF;

  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_sessions' AND policyname = 'Users can view walk sessions for their dogs'
  ) THEN
    CREATE POLICY "Users can view walk sessions for their dogs"
      ON walk_sessions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profile_dogs pd
          WHERE pd.dog_id = walk_sessions.dog_id
          AND pd.profile_id = auth.uid()
        )
      );
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_sessions' AND policyname = 'Users can update their own walk sessions'
  ) THEN
    CREATE POLICY "Users can update their own walk sessions"
      ON walk_sessions
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profile_dogs pd
          WHERE pd.dog_id = walk_sessions.dog_id
          AND pd.profile_id = auth.uid()
        )
      );
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_sessions' AND policyname = 'Users can delete their own walk sessions'
  ) THEN
    CREATE POLICY "Users can delete their own walk sessions"
      ON walk_sessions
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profile_dogs pd
          WHERE pd.dog_id = walk_sessions.dog_id
          AND pd.profile_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create or replace function to update walk_sessions statistics
CREATE OR REPLACE FUNCTION update_walk_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update points count
    UPDATE walk_sessions
    SET points_count = (
      SELECT COUNT(*) FROM walk_points
      WHERE session_id = NEW.id
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats when walk session status changes
DROP TRIGGER IF EXISTS update_walk_session_stats_trigger ON walk_sessions;
CREATE TRIGGER update_walk_session_stats_trigger
AFTER UPDATE OF status ON walk_sessions
FOR EACH ROW
EXECUTE FUNCTION update_walk_session_stats();

-- Create or replace view for walk statistics
DROP VIEW IF EXISTS walk_statistics CASCADE;
CREATE VIEW walk_statistics AS
SELECT 
  ws.dog_id,
  d.name AS dog_name,
  COUNT(DISTINCT ws.id) AS total_walks,
  SUM(ws.distance) AS total_distance,
  SUM(ws.territory_gained) AS total_territory_gained,
  SUM(ws.points_count) AS total_points,
  MAX(ws.ended_at) AS last_walk_date
FROM walk_sessions ws
JOIN dogs d ON ws.dog_id = d.id
WHERE ws.status = 'completed'
GROUP BY ws.dog_id, d.name;

-- Grant access to the view
GRANT SELECT ON walk_statistics TO authenticated;