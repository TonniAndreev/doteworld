/*
  # Add dog invite notification system
  
  1. New Functions
    - `notify_dog_invite()`: Creates notifications when dog ownership invites are sent
    
  2. Notifications Table
    - Creates notifications table if it doesn't exist
    - Adds appropriate indexes
    - Enables RLS
    - Adds safe policy creation with existence checks
    
  3. Triggers
    - Adds trigger for dog invite notifications
*/

-- Create a function to notify users of dog ownership invites
CREATE OR REPLACE FUNCTION notify_dog_invite()
RETURNS TRIGGER AS $$
DECLARE
  inviter_name text;
  dog_name text;
BEGIN
  -- Get inviter's name
  SELECT CONCAT(first_name, ' ', last_name) INTO inviter_name
  FROM profiles
  WHERE id = NEW.inviter_id;
  
  -- Get dog's name
  SELECT name INTO dog_name
  FROM dogs
  WHERE id = NEW.dog_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.invitee_id,
    'dog_invite',
    'Dog Co-ownership Invite',
    CONCAT(inviter_name, ' invited you to be a ', NEW.role, ' of ', dog_name),
    jsonb_build_object(
      'inviteId', NEW.id,
      'dogId', NEW.dog_id,
      'dogName', dog_name,
      'inviterId', NEW.inviter_id,
      'inviterName', inviter_name,
      'role', NEW.role
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error creating dog invite notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable RLS on notifications if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create RLS policies for notifications only if they don't exist
DO $$
BEGIN
  -- Check if the SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
      ON notifications
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- Check if the UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications"
      ON notifications
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- Check if the DELETE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can delete their own notifications'
  ) THEN
    CREATE POLICY "Users can delete their own notifications"
      ON notifications
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

-- Create trigger for dog invite notifications if it doesn't exist
DROP TRIGGER IF EXISTS dog_invite_notification_trigger ON dog_ownership_invites;
CREATE TRIGGER dog_invite_notification_trigger
  AFTER INSERT ON dog_ownership_invites
  FOR EACH ROW
  EXECUTE FUNCTION notify_dog_invite();