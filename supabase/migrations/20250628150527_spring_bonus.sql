/*
  # Add Walk History Feature

  1. New Tables
    - Create walk_history table to store completed walks
    - Add relationship to dogs and users

  2. Security
    - Enable RLS on new tables
    - Add policies for proper access control
    - Ensure users can only access their own walk history
*/

-- Create walk_history table if it doesn't exist
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

-- Enable RLS on walk_history
ALTER TABLE walk_history ENABLE ROW LEVEL SECURITY;

-- Create policies for walk_history
CREATE POLICY "Users can insert their own walk history"
  ON walk_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own walk history"
  ON walk_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own walk history"
  ON walk_history
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own walk history"
  ON walk_history
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_walk_history_dog_id ON walk_history(dog_id);
CREATE INDEX IF NOT EXISTS idx_walk_history_user_id ON walk_history(user_id);
CREATE INDEX IF NOT EXISTS idx_walk_history_start_time ON walk_history(start_time);

-- Create view for walk statistics
CREATE OR REPLACE VIEW user_walk_statistics AS
SELECT 
  user_id,
  COUNT(*) AS total_walks,
  SUM(distance) AS total_distance,
  SUM(territory_gained) AS total_territory,
  SUM(duration) AS total_duration,
  MAX(end_time) AS last_walk_date
FROM walk_history
WHERE end_time IS NOT NULL
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON user_walk_statistics TO authenticated;