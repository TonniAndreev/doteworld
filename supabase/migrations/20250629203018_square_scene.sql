/*
  # Create achievements system

  1. New Tables
    - `achievements` table to store achievement definitions
    - `profile_achievements` junction table to track user achievements

  2. Sample Data
    - Adds 10 sample achievements with descriptions and icons
    
  3. Security
    - Enable RLS on both tables
    - Add appropriate policies for data access
*/

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create profile_achievements junction table
CREATE TABLE IF NOT EXISTS profile_achievements (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  obtained_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, achievement_id)
);

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profile_achievements
ALTER TABLE profile_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can read achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON profile_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON profile_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON profile_achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON profile_achievements;

-- Create RLS policies for achievements
CREATE POLICY "Public can read achievements"
  ON achievements
  FOR SELECT
  TO public
  USING (true);

-- Create RLS policies for profile_achievements
CREATE POLICY "Users can view own achievements"
  ON profile_achievements
  FOR SELECT
  TO public
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own achievements"
  ON profile_achievements
  FOR INSERT
  TO public
  WITH CHECK (profile_id = auth.uid());

-- Insert sample achievements
INSERT INTO achievements (key, title, description, icon_url) VALUES
  ('first_steps', 'First Steps', 'Complete your first walk with your dog', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('territory_king', 'Territory King', 'Conquer over 100,000 square meters of territory', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('social_butterfly', 'Social Butterfly', 'Connect with at least 3 other dog owners', 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('marathon_walker', 'Marathon Walker', 'Walk a total of 42.2 kilometers with your dog', 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('early_bird', 'Early Bird', 'Complete a walk before 7 AM', 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('night_owl', 'Night Owl', 'Complete a walk after 10 PM', 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('city_explorer', 'City Explorer', 'Conquer territory in 3 different cities', 'https://images.pexels.com/photos/374906/pexels-photo-374906.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('consistent_walker', 'Consistent Walker', 'Walk your dog for 7 consecutive days', 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('dog_whisperer', 'Dog Whisperer', 'Add 3 dogs to your profile', 'https://images.pexels.com/photos/333083/pexels-photo-333083.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('territory_giant', 'Territory Giant', 'Conquer over 1,000,000 square meters of territory', 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300')
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon_url = EXCLUDED.icon_url;