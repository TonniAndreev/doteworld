/*
  # Add achievements table and sample achievements

  1. New Table
    - `achievements` - Stores achievement definitions
      - `id` (uuid, primary key)
      - `key` (text, unique) - Unique identifier for the achievement
      - `title` (text) - Display name
      - `description` (text) - Detailed description
      - `icon_url` (text) - URL to the achievement icon
      - `created_at` (timestamp) - When the achievement was created

  2. Sample Data
    - Adds several sample achievements for users to earn
    
  3. Security
    - Enable RLS on achievements table
    - Add policy for public read access
*/

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can read achievements" 
  ON achievements
  FOR SELECT 
  TO public
  USING (true);

-- Insert sample achievements
INSERT INTO achievements (key, title, description, icon_url)
VALUES
  ('first_steps', 'First Steps', 'Complete your first walk with your dog', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('social_butterfly', 'Social Butterfly', 'Connect with at least 3 other dog owners', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('territory_king', 'Territory King', 'Conquer at least 100,000 m² of territory', 'https://images.pexels.com/photos/333083/pexels-photo-333083.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('marathon_walker', 'Marathon Walker', 'Walk a total of 42.2 km with your dog', 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('early_bird', 'Early Bird', 'Complete a walk before 7 AM', 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('night_owl', 'Night Owl', 'Complete a walk after 10 PM', 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('city_explorer', 'City Explorer', 'Conquer territory in at least 3 different cities', 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'),
  ('consistent_walker', 'Consistent Walker', 'Complete walks on 7 consecutive days', 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300')
ON CONFLICT (key) DO UPDATE
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon_url = EXCLUDED.icon_url;

-- Create a function to check and award the "First Steps" achievement
CREATE OR REPLACE FUNCTION check_first_steps_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- If a walk session is completed
  IF NEW.status = 'completed' THEN
    -- Check if the user already has the achievement
    IF NOT EXISTS (
      SELECT 1 FROM profile_achievements pa
      JOIN achievements a ON pa.achievement_id = a.id
      JOIN profile_dogs pd ON pd.dog_id = NEW.dog_id
      WHERE a.key = 'first_steps' AND pd.profile_id = pd.profile_id
    ) THEN
      -- Award the achievement
      INSERT INTO profile_achievements (profile_id, achievement_id)
      SELECT pd.profile_id, a.id
      FROM profile_dogs pd
      CROSS JOIN achievements a
      WHERE pd.dog_id = NEW.dog_id AND a.key = 'first_steps';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the "First Steps" achievement
DROP TRIGGER IF EXISTS check_first_steps_achievement_trigger ON walk_sessions;
CREATE TRIGGER check_first_steps_achievement_trigger
AFTER UPDATE OF status ON walk_sessions
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION check_first_steps_achievement();

-- Create a function to check and award the "Territory King" achievement
CREATE OR REPLACE FUNCTION check_territory_king_achievement()
RETURNS TRIGGER AS $$
DECLARE
  total_territory NUMERIC;
  profile_id UUID;
  achievement_id UUID;
BEGIN
  -- Get the profile ID for this dog
  SELECT pd.profile_id INTO profile_id
  FROM profile_dogs pd
  WHERE pd.dog_id = NEW.dog_id
  LIMIT 1;
  
  IF profile_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate total territory for this user
  SELECT SUM(ws.territory_gained) INTO total_territory
  FROM walk_sessions ws
  JOIN profile_dogs pd ON ws.dog_id = pd.dog_id
  WHERE pd.profile_id = profile_id
  AND ws.status = 'completed';
  
  -- If total territory is at least 0.1 km² (100,000 m²)
  IF total_territory >= 0.1 THEN
    -- Get the achievement ID
    SELECT id INTO achievement_id
    FROM achievements
    WHERE key = 'territory_king';
    
    IF achievement_id IS NOT NULL THEN
      -- Check if the user already has the achievement
      IF NOT EXISTS (
        SELECT 1 FROM profile_achievements
        WHERE profile_id = profile_id AND achievement_id = achievement_id
      ) THEN
        -- Award the achievement
        INSERT INTO profile_achievements (profile_id, achievement_id)
        VALUES (profile_id, achievement_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the "Territory King" achievement
DROP TRIGGER IF EXISTS check_territory_king_achievement_trigger ON walk_sessions;
CREATE TRIGGER check_territory_king_achievement_trigger
AFTER UPDATE OF status ON walk_sessions
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION check_territory_king_achievement();

-- Create a function to check and award the "Social Butterfly" achievement
CREATE OR REPLACE FUNCTION check_social_butterfly_achievement()
RETURNS TRIGGER AS $$
DECLARE
  friend_count INTEGER;
  achievement_id UUID;
BEGIN
  -- Only proceed if the friendship is accepted
  IF NEW.status = 'accepted' THEN
    -- Count accepted friendships for the requester
    SELECT COUNT(*) INTO friend_count
    FROM friendships
    WHERE (requester_id = NEW.requester_id OR receiver_id = NEW.requester_id)
    AND status = 'accepted';
    
    -- If the requester has at least 3 friends
    IF friend_count >= 3 THEN
      -- Get the achievement ID
      SELECT id INTO achievement_id
      FROM achievements
      WHERE key = 'social_butterfly';
      
      IF achievement_id IS NOT NULL THEN
        -- Check if the requester already has the achievement
        IF NOT EXISTS (
          SELECT 1 FROM profile_achievements
          WHERE profile_id = NEW.requester_id AND achievement_id = achievement_id
        ) THEN
          -- Award the achievement to the requester
          INSERT INTO profile_achievements (profile_id, achievement_id)
          VALUES (NEW.requester_id, achievement_id);
        END IF;
      END IF;
    END IF;
    
    -- Count accepted friendships for the receiver
    SELECT COUNT(*) INTO friend_count
    FROM friendships
    WHERE (requester_id = NEW.receiver_id OR receiver_id = NEW.receiver_id)
    AND status = 'accepted';
    
    -- If the receiver has at least 3 friends
    IF friend_count >= 3 THEN
      -- Get the achievement ID
      SELECT id INTO achievement_id
      FROM achievements
      WHERE key = 'social_butterfly';
      
      IF achievement_id IS NOT NULL THEN
        -- Check if the receiver already has the achievement
        IF NOT EXISTS (
          SELECT 1 FROM profile_achievements
          WHERE profile_id = NEW.receiver_id AND achievement_id = achievement_id
        ) THEN
          -- Award the achievement to the receiver
          INSERT INTO profile_achievements (profile_id, achievement_id)
          VALUES (NEW.receiver_id, achievement_id);
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the "Social Butterfly" achievement
DROP TRIGGER IF EXISTS check_social_butterfly_achievement_trigger ON friendships;
CREATE TRIGGER check_social_butterfly_achievement_trigger
AFTER UPDATE OF status ON friendships
FOR EACH ROW
WHEN (NEW.status = 'accepted')
EXECUTE FUNCTION check_social_butterfly_achievement();