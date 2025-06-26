/*
  # Fix Dog Ownership System

  1. Database Changes
    - Allow multiple owners per dog through profile_dogs junction table
    - Add ownership role (owner, co-owner, caretaker)
    - Add ownership permissions and timestamps
    - Improve data integrity constraints

  2. Security
    - Update RLS policies for shared ownership
    - Ensure proper access control for dog data
    - Add policies for ownership management

  3. Data Persistence
    - Ensure all operations write to database
    - Remove cache-only operations
    - Add proper error handling and rollback
*/

-- Add ownership role and permissions to profile_dogs table
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_dogs' AND column_name = 'role'
  ) THEN
    ALTER TABLE profile_dogs ADD COLUMN role text DEFAULT 'owner' CHECK (role IN ('owner', 'co-owner', 'caretaker'));
  END IF;

  -- Add created_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_dogs' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profile_dogs ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Add permissions column for fine-grained access control
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_dogs' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE profile_dogs ADD COLUMN permissions jsonb DEFAULT '{"edit": true, "delete": false, "share": false}'::jsonb;
  END IF;

  -- Add invited_by column to track who added this person as co-owner
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_dogs' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE profile_dogs ADD COLUMN invited_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Update existing records to have proper permissions
UPDATE profile_dogs 
SET permissions = CASE 
  WHEN role = 'owner' THEN '{"edit": true, "delete": true, "share": true}'::jsonb
  WHEN role = 'co-owner' THEN '{"edit": true, "delete": false, "share": true}'::jsonb
  ELSE '{"edit": false, "delete": false, "share": false}'::jsonb
END
WHERE permissions IS NULL;

-- Create dog_ownership_invites table for managing co-ownership invitations
CREATE TABLE IF NOT EXISTS dog_ownership_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('co-owner', 'caretaker')),
  permissions jsonb DEFAULT '{"edit": true, "delete": false, "share": false}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  responded_at timestamptz,
  
  -- Ensure unique pending invites
  UNIQUE(dog_id, invitee_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS on dog_ownership_invites
ALTER TABLE dog_ownership_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dog_ownership_invites
CREATE POLICY "Users can view invites sent to them"
  ON dog_ownership_invites
  FOR SELECT
  TO authenticated
  USING (invitee_id = auth.uid());

CREATE POLICY "Users can view invites they sent"
  ON dog_ownership_invites
  FOR SELECT
  TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "Dog owners can send invites"
  ON dog_ownership_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    inviter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = dog_ownership_invites.dog_id 
      AND pd.profile_id = auth.uid()
      AND (pd.permissions->>'share')::boolean = true
    )
  );

CREATE POLICY "Invitees can update their invites"
  ON dog_ownership_invites
  FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid());

-- Update RLS policies for profile_dogs to support multiple owners
DROP POLICY IF EXISTS "Link dog to profile" ON profile_dogs;
DROP POLICY IF EXISTS "Select own links" ON profile_dogs;
DROP POLICY IF EXISTS "Unlink own dog" ON profile_dogs;

CREATE POLICY "Users can link dogs they own or are invited to"
  ON profile_dogs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid() AND (
      -- User is creating initial ownership
      NOT EXISTS (SELECT 1 FROM profile_dogs WHERE dog_id = profile_dogs.dog_id) OR
      -- User has accepted an invite
      EXISTS (
        SELECT 1 FROM dog_ownership_invites doi
        WHERE doi.dog_id = profile_dogs.dog_id 
        AND doi.invitee_id = auth.uid()
        AND doi.status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can view their dog relationships"
  ON profile_dogs
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view dogs they have access to"
  ON profile_dogs
  FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profile_dogs pd2
      WHERE pd2.dog_id = profile_dogs.dog_id
      AND pd2.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlink their own dog relationships"
  ON profile_dogs
  FOR DELETE
  TO authenticated
  USING (
    profile_id = auth.uid() AND (
      -- User is the owner
      role = 'owner' OR
      -- User is removing themselves as co-owner/caretaker
      profile_id = auth.uid()
    )
  );

-- Update RLS policies for dogs to support multiple owners
DROP POLICY IF EXISTS "Owners delete dogs" ON dogs;
DROP POLICY IF EXISTS "Owners update dogs" ON dogs;

CREATE POLICY "Dog owners can update dogs"
  ON dogs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = dogs.id 
      AND pd.profile_id = auth.uid()
      AND (pd.permissions->>'edit')::boolean = true
    )
  );

CREATE POLICY "Dog owners can delete dogs"
  ON dogs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_dogs pd
      WHERE pd.dog_id = dogs.id 
      AND pd.profile_id = auth.uid()
      AND (pd.permissions->>'delete')::boolean = true
    )
  );

-- Function to handle dog ownership invite acceptance
CREATE OR REPLACE FUNCTION accept_dog_ownership_invite(invite_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record dog_ownership_invites%ROWTYPE;
BEGIN
  -- Get the invite record
  SELECT * INTO invite_record
  FROM dog_ownership_invites
  WHERE id = invite_id
  AND invitee_id = auth.uid()
  AND status = 'pending'
  AND expires_at > now();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Start transaction
  BEGIN
    -- Update invite status
    UPDATE dog_ownership_invites
    SET status = 'accepted', responded_at = now()
    WHERE id = invite_id;

    -- Add user to dog ownership
    INSERT INTO profile_dogs (profile_id, dog_id, role, permissions, invited_by)
    VALUES (
      invite_record.invitee_id,
      invite_record.dog_id,
      invite_record.role,
      invite_record.permissions,
      invite_record.inviter_id
    );

    RETURN true;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RETURN false;
  END;
END;
$$;

-- Function to handle dog ownership invite decline
CREATE OR REPLACE FUNCTION decline_dog_ownership_invite(invite_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE dog_ownership_invites
  SET status = 'declined', responded_at = now()
  WHERE id = invite_id
  AND invitee_id = auth.uid()
  AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Function to remove co-owner
CREATE OR REPLACE FUNCTION remove_dog_co_owner(dog_id_param uuid, profile_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user has permission to remove co-owners
  IF NOT EXISTS (
    SELECT 1 FROM profile_dogs pd
    WHERE pd.dog_id = dog_id_param
    AND pd.profile_id = auth.uid()
    AND (pd.permissions->>'share')::boolean = true
  ) THEN
    RETURN false;
  END IF;

  -- Remove the co-owner relationship (but not if they're the original owner)
  DELETE FROM profile_dogs
  WHERE dog_id = dog_id_param
  AND profile_id = profile_id_param
  AND role != 'owner';

  RETURN FOUND;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_dogs_dog_id ON profile_dogs(dog_id);
CREATE INDEX IF NOT EXISTS idx_profile_dogs_profile_id ON profile_dogs(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_dogs_role ON profile_dogs(role);
CREATE INDEX IF NOT EXISTS idx_dog_ownership_invites_invitee ON dog_ownership_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_dog_ownership_invites_dog ON dog_ownership_invites(dog_id);
CREATE INDEX IF NOT EXISTS idx_dog_ownership_invites_status ON dog_ownership_invites(status);

-- Create a view for easy querying of dog ownership with user details
CREATE OR REPLACE VIEW dog_owners_view AS
SELECT 
  pd.dog_id,
  pd.profile_id,
  pd.role,
  pd.permissions,
  pd.created_at as ownership_since,
  pd.invited_by,
  p.first_name,
  p.last_name,
  p.avatar_url,
  d.name as dog_name,
  d.breed as dog_breed
FROM profile_dogs pd
JOIN profiles p ON pd.profile_id = p.id
JOIN dogs d ON pd.dog_id = d.id;

-- Grant access to the view
GRANT SELECT ON dog_owners_view TO authenticated;