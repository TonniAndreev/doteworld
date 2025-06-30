/*
  # Create notification_preferences table

  1. New Table
    - notification_preferences: Stores user notification preferences
    - Includes settings for different notification types
    - Supports push and email notification preferences

  2. Security
    - Enable RLS on the table
    - Add policies for user access
    - Ensure users can only access their own preferences
*/

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- User notification preferences
  user_friend_request boolean DEFAULT true,
  user_friend_accepted boolean DEFAULT true,
  user_dog_ownership boolean DEFAULT true,
  user_walk_reminder boolean DEFAULT true,
  user_vet_appointment boolean DEFAULT true,
  
  -- Achievement notification preferences
  achievement_badge_earned boolean DEFAULT true,
  achievement_territory_milestone boolean DEFAULT true,
  achievement_walking_goal boolean DEFAULT true,
  
  -- Social notification preferences
  social_friend_photo boolean DEFAULT true,
  social_comment boolean DEFAULT true,
  social_dog_birthday boolean DEFAULT true,
  
  -- System notification preferences
  system_app_update boolean DEFAULT true,
  system_safety_alert boolean DEFAULT true,
  system_announcement boolean DEFAULT true,
  
  -- Global notification settings
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_timestamp
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Create default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences);