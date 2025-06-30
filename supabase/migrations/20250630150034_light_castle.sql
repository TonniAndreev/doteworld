/*
  # Dog Ownership Management

  1. New Functions
    - search_users_for_dog_ownership: Search for users to add as dog owners
    - add_dog_owner: Add an existing user as a dog owner
    - transfer_alpha_ownership: Transfer Alpha ownership from one user to another
  
  2. Security
    - RLS policies to ensure only Alpha owners can add/remove owners and transfer ownership
    - Security definer functions to ensure proper authorization
*/

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
    u.email,
    (p.id IN (SELECT profile_id FROM existing_owners)) AS is_already_owner
  FROM 
    profiles p
    JOIN auth.users u ON p.id = u.id
  WHERE 
    (p.first_name ILIKE '%' || p_search_query || '%' OR
     p.last_name ILIKE '%' || p_search_query || '%' OR
     u.email ILIKE '%' || p_search_query || '%')
  ORDER BY 
    is_already_owner ASC,
    p.first_name ASC,
    p.last_name ASC
  LIMIT p_limit;
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