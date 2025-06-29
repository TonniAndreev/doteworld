-- Add email field to dog ownership invites
ALTER TABLE dog_ownership_invites ADD COLUMN IF NOT EXISTS invitee_email TEXT;

-- Create function to send notification when a dog invite is created
CREATE OR REPLACE FUNCTION notify_dog_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_dog_name TEXT;
  v_inviter_name TEXT;
  v_notification_id UUID;
BEGIN
  -- Get dog name
  SELECT name INTO v_dog_name FROM dogs WHERE id = NEW.dog_id;
  
  -- Get inviter name
  SELECT 
    CONCAT(first_name, ' ', last_name) INTO v_inviter_name 
  FROM profiles 
  WHERE id = NEW.inviter_id;
  
  -- Insert notification for the invitee
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    created_at
  ) VALUES (
    NEW.invitee_id,
    'dog_invite',
    'Dog Ownership Invite',
    CONCAT(v_inviter_name, ' invited you to be a ', NEW.role, ' of ', v_dog_name),
    jsonb_build_object(
      'inviteId', NEW.id,
      'dogId', NEW.dog_id,
      'dogName', v_dog_name,
      'inviterId', NEW.inviter_id,
      'inviterName', v_inviter_name
    ),
    NEW.created_at
  ) RETURNING id INTO v_notification_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dog invite notifications
DROP TRIGGER IF EXISTS dog_invite_notification_trigger ON dog_ownership_invites;
CREATE TRIGGER dog_invite_notification_trigger
AFTER INSERT ON dog_ownership_invites
FOR EACH ROW
EXECUTE FUNCTION notify_dog_invite();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);