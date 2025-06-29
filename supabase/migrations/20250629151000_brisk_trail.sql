/*
  # Add walk_points and territory tables

  1. walk_points
    - Records individual GPS points for a dog's walk session
    - Indexed by dog_id and walk_session_id

  2. territory
    - Links a dog to a walk_point indicating territory marking

  3. Security
    - Enable RLS and allow dog owners to insert/select their own data
*/

-- Create walk_points table
CREATE TABLE IF NOT EXISTS walk_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  walk_session_id text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  "timestamp" timestamptz DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_walk_points_dog_id ON walk_points(dog_id);
CREATE INDEX IF NOT EXISTS idx_walk_points_walk_session_id ON walk_points(walk_session_id);

-- Enable RLS on walk_points
ALTER TABLE walk_points ENABLE ROW LEVEL SECURITY;

-- Policies for walk_points
CREATE POLICY "Dog owners can insert walk points"
  ON walk_points
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = walk_points.dog_id
      AND pd.profile_id = auth.uid()
    )
  );

CREATE POLICY "Dog owners can view walk points"
  ON walk_points
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = walk_points.dog_id
      AND pd.profile_id = auth.uid()
    )
  );

-- Create territory table linking walk_points and dogs
CREATE TABLE IF NOT EXISTS territory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_point_id uuid REFERENCES walk_points(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE
);

-- Enable RLS on territory
ALTER TABLE territory ENABLE ROW LEVEL SECURITY;

-- Policies for territory
CREATE POLICY "Dog owners can insert territory"
  ON territory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = territory.dog_id
      AND pd.profile_id = auth.uid()
    )
  );

CREATE POLICY "Dog owners can view territory"
  ON territory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = territory.dog_id
      AND pd.profile_id = auth.uid()
    )
  );
