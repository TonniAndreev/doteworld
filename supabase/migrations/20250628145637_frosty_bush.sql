/*
  # Add Walk Sessions Table

  1. New Tables
    - `walk_sessions` - Stores metadata about each walk session
      - `id` (uuid, primary key)
      - `dog_id` (uuid, foreign key to dogs)
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz)
      - `distance` (double precision) - Total distance walked in km
      - `points_count` (integer) - Number of GPS points recorded
      - `territory_gained` (double precision) - Territory area gained in km²
      - `status` (text) - Status of the walk (active, completed, cancelled)
      - `weather_conditions` (jsonb) - Optional weather data during walk
      - `created_at` (timestamptz)

  2. Changes
    - Add foreign key to `walk_points` table to reference `walk_sessions`
    - Update `walk_points` to use `session_id` instead of `walk_session_id`

  3. Security
    - Enable RLS on the new table
    - Add policies for proper access control
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_walk_sessions_dog_id ON walk_sessions(dog_id);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_status ON walk_sessions(status);
CREATE INDEX IF NOT EXISTS idx_walk_points_session_id ON walk_points(session_id);

-- Enable RLS on walk_sessions
ALTER TABLE walk_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for walk_sessions
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

-- Create a function to update walk_sessions statistics when a walk is completed
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
CREATE TRIGGER update_walk_session_stats_trigger
AFTER UPDATE OF status ON walk_sessions
FOR EACH ROW
EXECUTE FUNCTION update_walk_session_stats();

-- Create a view for walk statistics
CREATE OR REPLACE VIEW walk_statistics AS
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