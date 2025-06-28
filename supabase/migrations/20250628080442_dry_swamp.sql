/*
  # Create Comprehensive Badges System

  1. New Tables
    - `achievements` - Badge definitions with conquest and social focus
    - `profile_achievements` - User badge progress and completions
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to badges
    - Add policies for user badge progress management

  3. Badge Categories
    - Conquest badges (territory, distance, exploration)
    - Social badges (friends, sharing, community)
    - Milestone badges (streaks, achievements)
    - Special badges (seasonal, rare accomplishments)
*/

-- Create achievements table for badge definitions
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon_url text,
  category text DEFAULT 'general',
  difficulty text DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  target_value integer DEFAULT 1,
  unit text DEFAULT 'completion',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_achievements table for user progress
CREATE TABLE IF NOT EXISTS profile_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  current_value integer DEFAULT 0,
  obtained_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(profile_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Public can read achievements"
  ON achievements
  FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for profile_achievements
CREATE POLICY "Users can view own achievements"
  ON profile_achievements
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own achievements"
  ON profile_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own achievements"
  ON profile_achievements
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Insert 50 comprehensive badges focused on conquest and social features
INSERT INTO achievements (key, title, description, icon_url, category, difficulty, target_value, unit, sort_order) VALUES

-- CONQUEST BADGES (Territory & Exploration)
('first_steps', 'First Steps', 'Complete your very first conquest walk', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'easy', 1, 'walks', 1),
('territory_rookie', 'Territory Rookie', 'Conquer your first 100 square meters', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'easy', 100, 'square_meters', 2),
('neighborhood_explorer', 'Neighborhood Explorer', 'Conquer 1,000 square meters of territory', 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 1000, 'square_meters', 3),
('district_dominator', 'District Dominator', 'Conquer 10,000 square meters (1 hectare)', 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 10000, 'square_meters', 4),
('city_conqueror', 'City Conqueror', 'Conquer 100,000 square meters (10 hectares)', 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 100000, 'square_meters', 5),
('territory_king', 'Territory King', 'Conquer 1,000,000 square meters (1 km²)', 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'legendary', 1000000, 'square_meters', 6),

-- DISTANCE BADGES
('first_kilometer', 'First Kilometer', 'Walk your first kilometer during conquest', 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'easy', 1000, 'meters', 7),
('distance_walker', 'Distance Walker', 'Walk 10 kilometers total in conquests', 'https://images.pexels.com/photos/1246956/pexels-photo-1246956.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 10000, 'meters', 8),
('marathon_conqueror', 'Marathon Conqueror', 'Walk 42.2 kilometers total (marathon distance)', 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 42200, 'meters', 9),
('century_walker', 'Century Walker', 'Walk 100 kilometers total in conquests', 'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 100000, 'meters', 10),
('ultra_explorer', 'Ultra Explorer', 'Walk 500 kilometers total in conquests', 'https://images.pexels.com/photos/849835/pexels-photo-849835.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'legendary', 500000, 'meters', 11),

-- STREAK & CONSISTENCY BADGES
('daily_conqueror', 'Daily Conqueror', 'Complete conquests for 3 days in a row', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'easy', 3, 'days', 12),
('weekly_warrior', 'Weekly Warrior', 'Complete conquests for 7 days in a row', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 7, 'days', 13),
('consistency_champion', 'Consistency Champion', 'Complete conquests for 30 days in a row', 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 30, 'days', 14),
('unstoppable_force', 'Unstoppable Force', 'Complete conquests for 100 days in a row', 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'legendary', 100, 'days', 15),

-- TIME-BASED CONQUEST BADGES
('early_bird', 'Early Bird', 'Complete 5 conquests before 8 AM', 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 5, 'morning_walks', 16),
('night_owl', 'Night Owl', 'Complete 5 conquests after 8 PM', 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 5, 'evening_walks', 17),
('weekend_explorer', 'Weekend Explorer', 'Complete 10 conquests on weekends', 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 10, 'weekend_walks', 18),
('lunch_break_conqueror', 'Lunch Break Conqueror', 'Complete 5 conquests between 11 AM - 2 PM', 'https://images.pexels.com/photos/1246956/pexels-photo-1246956.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 5, 'lunch_walks', 19),

-- SOCIAL BADGES (Friends & Community)
('social_starter', 'Social Starter', 'Add your first friend on Dote', 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'easy', 1, 'friends', 20),
('friend_collector', 'Friend Collector', 'Have 5 friends on Dote', 'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'medium', 5, 'friends', 21),
('social_butterfly', 'Social Butterfly', 'Have 10 friends on Dote', 'https://images.pexels.com/photos/849835/pexels-photo-849835.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'medium', 10, 'friends', 22),
('community_leader', 'Community Leader', 'Have 25 friends on Dote', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'hard', 25, 'friends', 23),
('networking_master', 'Networking Master', 'Have 50 friends on Dote', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'legendary', 50, 'friends', 24),

-- SHARING & ENGAGEMENT BADGES
('first_share', 'First Share', 'Share your first conquest or badge', 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'easy', 1, 'shares', 25),
('content_creator', 'Content Creator', 'Share 10 conquests or badges', 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'medium', 10, 'shares', 26),
('influencer', 'Influencer', 'Share 50 conquests or badges', 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'hard', 50, 'shares', 27),
('viral_conqueror', 'Viral Conqueror', 'Share 100 conquests or badges', 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'legendary', 100, 'shares', 28),

-- COMPETITIVE BADGES
('leaderboard_climber', 'Leaderboard Climber', 'Reach top 100 in any leaderboard category', 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'medium', 1, 'leaderboard_rank', 29),
('top_performer', 'Top Performer', 'Reach top 50 in any leaderboard category', 'https://images.pexels.com/photos/1246956/pexels-photo-1246956.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'hard', 1, 'leaderboard_rank', 30),
('elite_conqueror', 'Elite Conqueror', 'Reach top 10 in any leaderboard category', 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'hard', 1, 'leaderboard_rank', 31),
('champion', 'Champion', 'Reach #1 in any leaderboard category', 'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'legendary', 1, 'leaderboard_rank', 32),

-- EXPLORATION BADGES
('park_explorer', 'Park Explorer', 'Conquer territory in 5 different parks', 'https://images.pexels.com/photos/849835/pexels-photo-849835.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 5, 'parks', 33),
('urban_adventurer', 'Urban Adventurer', 'Conquer territory in 10 different neighborhoods', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 10, 'neighborhoods', 34),
('city_wanderer', 'City Wanderer', 'Conquer territory in 3 different cities', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 3, 'cities', 35),
('globe_trotter', 'Globe Trotter', 'Conquer territory in 5 different cities', 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'legendary', 5, 'cities', 36),

-- SPECIAL ACHIEVEMENT BADGES
('speed_demon', 'Speed Demon', 'Complete a 1km conquest in under 10 minutes', 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 1, 'fast_walks', 37),
('endurance_master', 'Endurance Master', 'Complete a single conquest longer than 5km', 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 1, 'long_walks', 38),
('perfect_circle', 'Perfect Circle', 'Complete a conquest that forms a near-perfect circle', 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'hard', 1, 'perfect_shapes', 39),
('territory_artist', 'Territory Artist', 'Create 10 unique territory shapes', 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300', 'conquest', 'medium', 10, 'unique_shapes', 40),

-- MILESTONE BADGES
('badge_collector', 'Badge Collector', 'Earn your first 10 badges', 'https://images.pexels.com/photos/1246956/pexels-photo-1246956.jpeg?auto=compress&cs=tinysrgb&w=300', 'milestone', 'medium', 10, 'badges', 41),
('achievement_hunter', 'Achievement Hunter', 'Earn 25 badges', 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=300', 'milestone', 'hard', 25, 'badges', 42),
('completionist', 'Completionist', 'Earn 40 badges', 'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=300', 'milestone', 'legendary', 40, 'badges', 43),

-- SEASONAL & SPECIAL BADGES
('new_year_conqueror', 'New Year Conqueror', 'Complete a conquest on New Year\'s Day', 'https://images.pexels.com/photos/849835/pexels-photo-849835.jpeg?auto=compress&cs=tinysrgb&w=300', 'seasonal', 'medium', 1, 'holiday_walks', 44),
('valentine_walker', 'Valentine Walker', 'Complete a heart-shaped conquest on Valentine\'s Day', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300', 'seasonal', 'hard', 1, 'holiday_walks', 45),
('summer_explorer', 'Summer Explorer', 'Complete 20 conquests during summer months', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', 'seasonal', 'medium', 20, 'seasonal_walks', 46),
('winter_warrior', 'Winter Warrior', 'Complete 20 conquests during winter months', 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300', 'seasonal', 'hard', 20, 'seasonal_walks', 47),

-- COMMUNITY & HELPING BADGES
('helpful_friend', 'Helpful Friend', 'Help 5 friends complete their first conquest', 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'medium', 5, 'helped_friends', 48),
('mentor', 'Mentor', 'Help 10 new users get started with conquests', 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=300', 'social', 'hard', 10, 'mentored_users', 49),
('legend', 'Legend', 'Achieve legendary status by earning all other badges', 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300', 'milestone', 'legendary', 49, 'badges', 50)

ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_difficulty ON achievements(difficulty);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_profile ON profile_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_obtained ON profile_achievements(obtained_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_achievements_updated_at
  BEFORE UPDATE ON profile_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();