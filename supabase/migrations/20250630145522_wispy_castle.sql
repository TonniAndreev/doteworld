/*
  # Alpha Ownership Transfer

  1. New Functions
    - `transfer_alpha_ownership`: Transfers Alpha ownership from one user to another
    - `search_users_for_dog_ownership`: Searches for users to add as dog owners

  2. Security
    - Added RLS policies to ensure only Alpha owners can transfer ownership
    - Added validation to prevent invalid transfers

  3. Changes
    - Updated dog ownership management to support Alpha owner concept
    - Added search functionality for finding users to add as owners
*/

-- Function to transfer Alpha ownership from one user to another
CREATE OR REPLACE FUNCTION transfer_alpha_ownership(
  p_dog_id uuid,
  p_new_alpha_profile_id uuid,
  p_current_alpha_profile_id uuid
) RETURNS boolean AS $$
DECLARE
  v_current_role text;
  v_new_role text;
  v_current_permissions jsonb;
  v_new_permissions jsonb;
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
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding dog owner: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to ensure only Alpha owners can transfer ownership
DO $$
BEGIN
  -- Create a policy for the transfer_alpha_ownership function
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