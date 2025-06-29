/*
  # Dog Ownership Management Functions

  1. Functions
    - `accept_dog_ownership_invite` - Accepts a dog ownership invitation
    - `decline_dog_ownership_invite` - Declines a dog ownership invitation
    - `remove_dog_co_owner` - Removes a co-owner from a dog

  2. Security
    - All functions are secured with proper permission checks
    - Only authorized users can perform these operations
*/

-- Function to accept a dog ownership invitation
CREATE OR REPLACE FUNCTION accept_dog_ownership_invite(invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dog_id UUID;
  v_invitee_id UUID;
  v_role TEXT;
  v_permissions JSONB;
  v_current_user UUID;
BEGIN
  -- Get current user ID
  v_current_user := auth.uid();
  
  -- Check if the invite exists and belongs to the current user
  SELECT 
    dog_id, 
    invitee_id, 
    role, 
    permissions 
  INTO 
    v_dog_id, 
    v_invitee_id, 
    v_role, 
    v_permissions
  FROM dog_ownership_invites
  WHERE 
    id = invite_id 
    AND invitee_id = v_current_user
    AND status = 'pending'
    AND expires_at > now();
  
  -- If invite not found or not valid, return false
  IF v_dog_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Begin transaction
  BEGIN
    -- Update invite status to accepted
    UPDATE dog_ownership_invites
    SET 
      status = 'accepted',
      responded_at = now()
    WHERE id = invite_id;
    
    -- Create profile_dogs entry
    INSERT INTO profile_dogs (
      profile_id,
      dog_id,
      role,
      permissions,
      invited_by
    )
    SELECT 
      invitee_id,
      dog_id,
      role,
      permissions,
      inviter_id
    FROM dog_ownership_invites
    WHERE id = invite_id;
    
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$;

-- Function to decline a dog ownership invitation
CREATE OR REPLACE FUNCTION decline_dog_ownership_invite(invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitee_id UUID;
  v_current_user UUID;
BEGIN
  -- Get current user ID
  v_current_user := auth.uid();
  
  -- Check if the invite exists and belongs to the current user
  SELECT invitee_id
  INTO v_invitee_id
  FROM dog_ownership_invites
  WHERE 
    id = invite_id 
    AND invitee_id = v_current_user
    AND status = 'pending';
  
  -- If invite not found or not valid, return false
  IF v_invitee_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update invite status to declined
  UPDATE dog_ownership_invites
  SET 
    status = 'declined',
    responded_at = now()
  WHERE id = invite_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- Function to remove a co-owner from a dog
CREATE OR REPLACE FUNCTION remove_dog_co_owner(dog_id_param UUID, profile_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user UUID;
  v_current_user_role TEXT;
  v_current_user_permissions JSONB;
  v_target_role TEXT;
BEGIN
  -- Get current user ID
  v_current_user := auth.uid();
  
  -- Check if current user has permission to remove co-owners
  SELECT role, permissions
  INTO v_current_user_role, v_current_user_permissions
  FROM profile_dogs
  WHERE 
    dog_id = dog_id_param 
    AND profile_id = v_current_user;
  
  -- If current user doesn't have access or doesn't have share permission, return false
  IF v_current_user_role IS NULL OR (v_current_user_permissions->>'share')::BOOLEAN = FALSE THEN
    RETURN FALSE;
  END IF;
  
  -- Check target user's role
  SELECT role
  INTO v_target_role
  FROM profile_dogs
  WHERE 
    dog_id = dog_id_param 
    AND profile_id = profile_id_param;
  
  -- Cannot remove the original owner
  IF v_target_role = 'owner' THEN
    RETURN FALSE;
  END IF;
  
  -- Remove the co-owner
  DELETE FROM profile_dogs
  WHERE 
    dog_id = dog_id_param 
    AND profile_id = profile_id_param
    AND role != 'owner';
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION accept_dog_ownership_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_dog_ownership_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_dog_co_owner(UUID, UUID) TO authenticated;