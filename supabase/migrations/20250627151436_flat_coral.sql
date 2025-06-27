/*
  # Fix Profile Dogs Policies - Remove Infinite Recursion

  1. Security Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new simplified policies that don't reference the same table
    - Ensure proper access control without circular dependencies

  2. Policy Structure
    - Users can view their own dog relationships
    - Friends can view each other's dog relationships (simplified)
    - Users can manage their own dog relationships
    - Proper insert/update/delete permissions
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Friends can view dog relationships" ON profile_dogs;
DROP POLICY IF EXISTS "Users can view dogs they have access to" ON profile_dogs;
DROP POLICY IF EXISTS "Users can view their dog relationships" ON profile_dogs;
DROP POLICY IF EXISTS "Users can link dogs they own or are invited to" ON profile_dogs;
DROP POLICY IF EXISTS "Users can unlink their own dog relationships" ON profile_dogs;

-- Create new simplified policies without recursion
CREATE POLICY "Users can view own dog relationships"
  ON profile_dogs
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view friend dog relationships"
  ON profile_dogs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.receiver_id = profile_dogs.profile_id)
        OR
        (f.receiver_id = auth.uid() AND f.requester_id = profile_dogs.profile_id)
      )
    )
  );

CREATE POLICY "Users can insert own dog relationships"
  ON profile_dogs
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own dog relationships"
  ON profile_dogs
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own dog relationships"
  ON profile_dogs
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());