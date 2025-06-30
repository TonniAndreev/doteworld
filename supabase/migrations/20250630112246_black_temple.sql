/*
  # Fix Friendship RLS Policies

  1. Changes
    - Update RLS policies for the friendships table
    - Allow both parties to delete accepted friendships
    - Allow requesters to delete pending requests
    - Fix issue with friend status not being properly detected

  2. Security
    - Maintain proper access control
    - Ensure users can only manage their own friendships
*/

-- Drop existing DELETE policies on friendships table
DROP POLICY IF EXISTS "Users can delete own friend requests" ON friendships;

-- Create policy to allow either party to delete an accepted friendship
CREATE POLICY "Users can delete accepted friendships"
  ON friendships
  FOR DELETE
  TO authenticated
  USING (
    (status = 'accepted' AND (requester_id = auth.uid() OR receiver_id = auth.uid()))
  );

-- Create policy to allow requesters to delete pending requests
CREATE POLICY "Requesters can delete pending friend requests"
  ON friendships
  FOR DELETE
  TO authenticated
  USING (
    (status = 'pending' AND requester_id = auth.uid())
  );

-- Create a view for easier friendship status checking
CREATE OR REPLACE VIEW user_friendships AS
SELECT 
  CASE 
    WHEN requester_id = auth.uid() THEN receiver_id
    ELSE requester_id
  END AS friend_id,
  status,
  CASE 
    WHEN requester_id = auth.uid() THEN true
    ELSE false
  END AS is_requester,
  created_at,
  updated_at,
  id
FROM friendships
WHERE requester_id = auth.uid() OR receiver_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON user_friendships TO authenticated;