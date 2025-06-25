/*
  # Seed initial achievements

  1. Achievements
    - Insert predefined achievements with keys, titles, descriptions, and icons
    - These are the base achievements that all users can earn
  
  2. Security
    - Achievements table already has RLS enabled
    - Public can read achievements (for displaying available achievements)
*/

-- Insert initial achievements
INSERT INTO achievements (key, title, description, icon_url) VALUES
  ('early_bird', 'Early Bird', 'Complete 5 walks before 8 AM', 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('territory_king', 'Territory King', 'Claim 10 km² of territory', 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('marathon_runner', 'Marathon Runner', 'Walk a total of 42.2 kilometers', 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('social_butterfly', 'Social Butterfly', 'Make 5 dog walking friends', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('night_owl', 'Night Owl', 'Complete 3 evening walks after sunset', 'https://images.pexels.com/photos/849835/pexels-photo-849835.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('weekend_warrior', 'Weekend Warrior', 'Walk for 2 hours on weekends', 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('explorer', 'Explorer', 'Visit 10 different parks', 'https://images.pexels.com/photos/1246956/pexels-photo-1246956.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('consistency_king', 'Consistency King', 'Walk every day for 30 days', 'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('first_steps', 'First Steps', 'Complete your first walk', 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300'),
  ('distance_master', 'Distance Master', 'Walk 100 kilometers total', 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=300')
ON CONFLICT (key) DO NOTHING;