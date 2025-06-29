/*
  # Create cities table and related structures

  1. New Tables
    - `cities` table to store city information
    - `profile_cities` junction table to track user participation in cities
  
  2. Changes to Existing Tables
    - Add `city_id` to `profiles` table for current city
    - Add `city_id` to `walk_sessions` table to track walks by city
  
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for data access
*/

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  country text NOT NULL,
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, state, country)
);

-- Enable RLS on cities
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create policies for cities
CREATE POLICY "Anyone can read cities"
  ON cities
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert cities"
  ON cities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add city_id to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_city_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_city_id uuid REFERENCES cities(id);
  END IF;
END $$;

-- Add city_id to walk_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_sessions' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE walk_sessions ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;

-- Create profile_cities junction table
CREATE TABLE IF NOT EXISTS profile_cities (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  last_conquered_at timestamptz DEFAULT now(),
  territory_size numeric DEFAULT 0,
  PRIMARY KEY (profile_id, city_id)
);

-- Enable RLS on profile_cities
ALTER TABLE profile_cities ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_cities
CREATE POLICY "Users can view their own city relationships"
  ON profile_cities
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view friends' city relationships"
  ON profile_cities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.receiver_id = profile_cities.profile_id)
        OR
        (f.receiver_id = auth.uid() AND f.requester_id = profile_cities.profile_id)
      )
    )
  );

CREATE POLICY "Users can insert their own city relationships"
  ON profile_cities
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own city relationships"
  ON profile_cities
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_current_city_id ON profiles(current_city_id);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_city_id ON walk_sessions(city_id);
CREATE INDEX IF NOT EXISTS idx_profile_cities_city_id ON profile_cities(city_id);
CREATE INDEX IF NOT EXISTS idx_cities_location ON cities(lat, lon);
CREATE INDEX IF NOT EXISTS idx_cities_name_country ON cities(name, country);