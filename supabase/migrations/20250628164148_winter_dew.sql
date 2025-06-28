/*
  # Walk Sessions and History Schema

  1. New Tables
    - `walk_sessions`: Tracks active walking sessions
    - `walk_history`: Stores completed walks with statistics
  2. Updates
    - Adds `session_id` column to `walk_points` table
  3. Views
    - `walk_statistics`: Aggregates statistics by dog
    - `user_walk_statistics`: Aggregates statistics by user
  4. Security
    - Enables RLS for new tables with appropriate policies
*/

-- Create walk_sessions table
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

-- Create walk_history table
CREATE TABLE IF NOT EXISTS walk_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  distance double precision DEFAULT 0,
  duration integer DEFAULT 0, -- in seconds
  territory_gained double precision DEFAULT 0,
  points_count integer DEFAULT 0,
  route_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_walk_sessions_dog_id ON walk_sessions(dog_id);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_status ON walk_sessions(status);
CREATE INDEX IF NOT EXISTS idx_walk_points_session_id ON walk_points(session_id);
CREATE INDEX IF NOT EXISTS idx_walk_history_dog_id ON walk_history(dog_id);
CREATE INDEX IF NOT EXISTS idx_walk_history_user_id ON walk_history(user_id);
CREATE INDEX IF NOT EXISTS idx_walk_history_start_time ON walk_history(start_time);

-- Enable RLS on walk_sessions
ALTER TABLE walk_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for walk_sessions with existence checks
DO $$
BEGIN
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
END$$;

-- Enable RLS on walk_history
ALTER TABLE walk_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for walk_history with existence checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_history' AND policyname = 'Users can insert their own walk history'
  ) THEN
    CREATE POLICY "Users can insert their own walk history"
      ON walk_history
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_history' AND policyname = 'Users can view their own walk history'
  ) THEN
    CREATE POLICY "Users can view their own walk history"
      ON walk_history
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_history' AND policyname = 'Users can update their own walk history'
  ) THEN
    CREATE POLICY "Users can update their own walk history"
      ON walk_history
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'walk_history' AND policyname = 'Users can delete their own walk history'
  ) THEN
    CREATE POLICY "Users can delete their own walk history"
      ON walk_history
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END$$;

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

-- Drop views if they exist to avoid conflicts
DROP VIEW IF EXISTS walk_statistics;
DROP VIEW IF EXISTS user_walk_statistics;

-- Create a view for walk statistics
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

-- Create a view for user walk statistics
CREATE VIEW user_walk_statistics AS
SELECT 
  wh.user_id,
  COUNT(*) AS total_walks,
  SUM(wh.distance) AS total_distance,
  SUM(wh.territory_gained) AS total_territory,
  SUM(wh.duration) AS total_duration,
  MAX(wh.end_time) AS last_walk_date
FROM walk_history wh
WHERE wh.end_time IS NOT NULL
GROUP BY wh.user_id;

-- Grant access to the views
GRANT SELECT ON walk_statistics TO authenticated;
GRANT SELECT ON user_walk_statistics TO authenticated;