-- This migration implements a hierarchical dog ownership system with Alpha Owners and Regular Owners

/*
# Hierarchical Dog Ownership System

1. New Roles and Permissions
   - Implement 'owner' (Alpha) and 'co-owner' (Regular) roles
   - Define permissions for each role type
   - Ensure Alpha owners have full administrative control

2. Ownership Transfer
   - Allow Alpha owners to transfer ownership to co-owners
   - Prevent removal of Alpha owners without transfer
   - Maintain ownership history

3. Security and Notifications
   - Add RLS policies to enforce ownership rules
   - Create notification system for ownership changes
   - Implement invitation acceptance/rejection flow
*/

-- Update the remove_dog_co_owner function to ensure only Alpha owners can remove others
CREATE OR REPLACE FUNCTION remove_dog_co_owner(
  dog_id_param uuid,
  profile_id_param uuid
) RETURNS boolean AS $$
DECLARE
  v_current_user_id uuid := auth.uid();
  v_current_user_role text;
  v_target_user_role text;
BEGIN
  -- Get current user's role for this dog
  SELECT role INTO v_current_user_role
  FROM profile_dogs
  WHERE dog_id = dog_id_param AND profile_id = v_current_user_id;
  
  -- Get target user's role for this dog
  SELECT role INTO v_target_user_role
  FROM profile_dogs
  WHERE dog_id = dog_id_param AND profile_id = profile_id_param;
  
  -- Check if current user is Alpha owner
  IF v_current_user_role IS NULL OR v_current_user_role != 'owner' THEN
    -- Allow users to remove themselves
    IF v_current_user_id = profile_id_param THEN
      -- But don't allow Alpha owners to remove themselves
      IF v_target_user_role = 'owner' THEN
        RAISE EXCEPTION 'Alpha owners cannot remove themselves. Transfer ownership first.';
      END IF;
    ELSE
      -- Only Alpha owners can remove others
      RAISE EXCEPTION 'Only the Alpha owner can remove other owners';
    END IF;
  END IF;
  
  -- Don't allow removing Alpha owners
  IF v_target_user_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the Alpha owner';
  END IF;
  
  -- Remove the co-owner
  DELETE FROM profile_dogs
  WHERE dog_id = dog_id_param AND profile_id = profile_id_param;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error removing co-owner: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer Alpha ownership from one user to another
CREATE OR REPLACE FUNCTION transfer_alpha_ownership(
  p_dog_id uuid,
  p_new_alpha_profile_id uuid,
  p_current_alpha_profile_id uuid DEFAULT auth.uid()
) RETURNS boolean AS $$
DECLARE
  v_current_role text;
  v_new_role text;
  v_current_permissions jsonb;
  v_new_permissions jsonb;
  v_dog_name text;
  v_current_user_name text;
  v_new_user_name text;
BEGIN
  -- Verify the current user is the Alpha owner
  SELECT role, permissions INTO v_current_role, v_current_permissions
  FROM profile_dogs
  WHERE dog_id = p_dog_id AND profile_id = p_current_alpha_profile_id;
  
  IF v_current_role IS NULL OR v_current_role != 'owner' THEN
    RAISE EXCEPTION 'Only the Alpha owner can transfer ownership';
  END IF;
  
  -- Verify the new Alpha is an existing owner
  SELECT role, permissions INTO v_new_role, v_new_permissions
  FROM profile_dogs
  WHERE dog_id = p_dog_id AND profile_id = p_new_alpha_profile_id;
  
  IF v_new_role IS NULL THEN
    RAISE EXCEPTION 'The new Alpha must be an existing owner of this dog';
  END IF;
  
  -- Prevent self-transfer
  IF p_current_alpha_profile_id = p_new_alpha_profile_id THEN
    RAISE EXCEPTION 'Cannot transfer Alpha ownership to yourself';
  END IF;
  
  -- Get dog name and user names for notifications
  SELECT name INTO v_dog_name FROM dogs WHERE id = p_dog_id;
  SELECT CONCAT(first_name, ' ', last_name) INTO v_current_user_name FROM profiles WHERE id = p_current_alpha_profile_id;
  SELECT CONCAT(first_name, ' ', last_name) INTO v_new_user_name FROM profiles WHERE id = p_new_alpha_profile_id;
  
  -- Update the current Alpha to be a regular owner
  UPDATE profile_dogs
  SET 
    role = 'co-owner',
    permissions = jsonb_build_object(
      'edit', true,
      'share', true,
      'delete', false
    )
  WHERE dog_id = p_dog_id AND profile_id = p_current_alpha_profile_id;
  
  -- Update the new user to be the Alpha
  UPDATE profile_dogs
  SET 
    role = 'owner',
    permissions = jsonb_build_object(
      'edit', true,
      'share', true,
      'delete', true
    )
  WHERE dog_id = p_dog_id AND profile_id = p_new_alpha_profile_id;
  
  -- Create notification for the new Alpha owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_new_alpha_profile_id,
    'alpha_transfer',
    'Alpha Ownership Transferred',
    CONCAT(v_current_user_name, ' transferred Alpha ownership of ', v_dog_name, ' to you'),
    jsonb_build_object(
      'dogId', p_dog_id,
      'dogName', v_dog_name,
      'previousAlphaId', p_current_alpha_profile_id,
      'previousAlphaName', v_current_user_name
    )
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error transferring Alpha ownership: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search for users to add as dog owners
CREATE OR REPLACE FUNCTION search_users_for_dog_ownership(
  p_search_query text,
  p_dog_id uuid,
  p_limit int DEFAULT 10
) RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  email text,
  is_already_owner boolean
) AS $$
BEGIN
  -- Return query with explicit casting and exclude current user
  RETURN QUERY
  WITH existing_owners AS (
    SELECT profile_id
    FROM profile_dogs
    WHERE dog_id = p_dog_id
  )
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(u.email::text, '')::text, -- Double cast to ensure text type
    (p.id IN (SELECT profile_id FROM existing_owners)) AS is_already_owner
  FROM 
    profiles p
    JOIN auth.users u ON p.id = u.id
  WHERE 
    p.id != auth.uid() AND -- Exclude current user
    (
      p.first_name ILIKE '%' || p_search_query || '%' OR
      p.last_name ILIKE '%' || p_search_query || '%' OR
      COALESCE(u.email::text, '') ILIKE '%' || p_search_query || '%'
    )
  ORDER BY 
    is_already_owner ASC,
    p.first_name ASC,
    p.last_name ASC
  LIMIT p_limit;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in search_users_for_dog_ownership: %', SQLERRM;
    -- Return empty result set on error
    RETURN QUERY SELECT 
      uuid_nil()::uuid,
      ''::text,
      ''::text,
      ''::text,
      ''::text,
      false::boolean
    WHERE false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add an existing user as a dog owner
CREATE OR REPLACE FUNCTION add_dog_owner(
  p_dog_id uuid,
  p_profile_id uuid,
  p_role text DEFAULT 'co-owner',
  p_current_user_id uuid DEFAULT auth.uid()
) RETURNS boolean AS $$
DECLARE
  v_current_role text;
  v_permissions jsonb;
  v_dog_name text;
  v_inviter_name text;
BEGIN
  -- Verify the current user is the Alpha owner
  SELECT role INTO v_current_role
  FROM profile_dogs
  WHERE dog_id = p_dog_id AND profile_id = p_current_user_id;
  
  IF v_current_role IS NULL OR v_current_role != 'owner' THEN
    RAISE EXCEPTION 'Only the Alpha owner can add new owners';
  END IF;
  
  -- Check if the user is already an owner
  IF EXISTS (
    SELECT 1 FROM profile_dogs
    WHERE dog_id = p_dog_id AND profile_id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'This user is already an owner of this dog';
  END IF;
  
  -- Check if we've reached the maximum number of owners (4)
  IF (
    SELECT COUNT(*) FROM profile_dogs
    WHERE dog_id = p_dog_id
  ) >= 4 THEN
    RAISE EXCEPTION 'This dog already has the maximum number of owners (4)';
  END IF;
  
  -- Set permissions based on role
  IF p_role = 'co-owner' THEN
    v_permissions := jsonb_build_object(
      'edit', true,
      'share', true,
      'delete', false
    );
  ELSE -- caretaker
    v_permissions := jsonb_build_object(
      'edit', false,
      'share', false,
      'delete', false
    );
  END IF;
  
  -- Add the new owner
  INSERT INTO profile_dogs (
    profile_id,
    dog_id,
    role,
    permissions,
    invited_by
  ) VALUES (
    p_profile_id,
    p_dog_id,
    p_role,
    v_permissions,
    p_current_user_id
  );
  
  -- Get dog name and inviter name for notification
  SELECT name INTO v_dog_name FROM dogs WHERE id = p_dog_id;
  SELECT CONCAT(first_name, ' ', last_name) INTO v_inviter_name FROM profiles WHERE id = p_current_user_id;
  
  -- Create notification for the new owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_profile_id,
    'dog_ownership',
    'New Dog Ownership',
    CONCAT(v_inviter_name, ' added you as a ', p_role, ' of ', v_dog_name),
    jsonb_build_object(
      'dogId', p_dog_id,
      'dogName', v_dog_name,
      'inviterId', p_current_user_id,
      'inviterName', v_inviter_name,
      'role', p_role
    )
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding dog owner: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the accept_dog_ownership_invite function to set proper permissions
CREATE OR REPLACE FUNCTION accept_dog_ownership_invite(
  invite_id uuid
) RETURNS boolean AS $$
DECLARE
  v_dog_id uuid;
  v_invitee_id uuid;
  v_role text;
  v_permissions jsonb;
  v_inviter_id uuid;
BEGIN
  -- Get invite details
  SELECT 
    dog_id, 
    invitee_id, 
    role, 
    permissions,
    inviter_id
  INTO 
    v_dog_id, 
    v_invitee_id, 
    v_role, 
    v_permissions,
    v_inviter_id
  FROM dog_ownership_invites
  WHERE id = invite_id AND status = 'pending' AND invitee_id = auth.uid();
  
  -- Check if invite exists and is valid
  IF v_dog_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Check if user is already an owner
  IF EXISTS (
    SELECT 1 FROM profile_dogs
    WHERE dog_id = v_dog_id AND profile_id = v_invitee_id
  ) THEN
    -- Update invite status
    UPDATE dog_ownership_invites
    SET 
      status = 'accepted',
      responded_at = now()
    WHERE id = invite_id;
    
    RAISE EXCEPTION 'You are already an owner of this dog';
  END IF;
  
  -- Set permissions based on role
  IF v_role = 'co-owner' THEN
    v_permissions := jsonb_build_object(
      'edit', true,
      'share', true,
      'delete', false
    );
  ELSE -- caretaker
    v_permissions := jsonb_build_object(
      'edit', false,
      'share', false,
      'delete', false
    );
  END IF;
  
  -- Add user as dog owner
  INSERT INTO profile_dogs (
    profile_id,
    dog_id,
    role,
    permissions,
    invited_by
  ) VALUES (
    v_invitee_id,
    v_dog_id,
    v_role,
    v_permissions,
    v_inviter_id
  );
  
  -- Update invite status
  UPDATE dog_ownership_invites
  SET 
    status = 'accepted',
    responded_at = now()
  WHERE id = invite_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error accepting dog ownership invite: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_users_for_dog_ownership TO authenticated;
GRANT EXECUTE ON FUNCTION add_dog_owner TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_alpha_ownership TO authenticated;
GRANT EXECUTE ON FUNCTION remove_dog_co_owner TO authenticated;
GRANT EXECUTE ON FUNCTION accept_dog_ownership_invite TO authenticated;

-- Update RLS policies to ensure only Alpha owners can transfer ownership
DO $$
BEGIN
  -- Create a policy for the transfer_alpha_ownership function if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profile_dogs' 
    AND policyname = 'Alpha owners can transfer ownership'
  ) THEN
    CREATE POLICY "Alpha owners can transfer ownership"
      ON profile_dogs
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profile_dogs
          WHERE profile_id = auth.uid()
          AND dog_id = profile_dogs.dog_id
          AND role = 'owner'
        )
      );
  END IF;
END
$$;