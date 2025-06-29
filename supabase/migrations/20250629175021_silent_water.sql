/*
  # Create walk_sessions table

  1. Changes
    - Create walk_sessions table if it doesn't exist
    - Add proper columns for tracking walk data
    - Add foreign key constraint to dogs table
    - Enable RLS and add appropriate policies

  2. Security
    - Enable RLS on walk_sessions
    - Add policies for dog owners to manage their walk sessions
*/

-- Create walk_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS walk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  distance numeric DEFAULT 0,
  points_count integer DEFAULT 0,
  territory_gained numeric DEFAULT 0,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  weather_conditions jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_walk_sessions_dog_id ON walk_sessions(dog_id);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_status ON walk_sessions(status);

-- Enable RLS on walk_sessions
ALTER TABLE walk_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for walk_sessions
CREATE POLICY "Dog owners can insert walk sessions"
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

CREATE POLICY "Dog owners can view walk sessions"
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

CREATE POLICY "Dog owners can update walk sessions"
  ON walk_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = walk_sessions.dog_id
      AND pd.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = walk_sessions.dog_id
      AND pd.profile_id = auth.uid()
    )
  );

CREATE POLICY "Dog owners can delete walk sessions"
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