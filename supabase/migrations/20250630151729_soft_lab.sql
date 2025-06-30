/*
  # Fix Search Users for Dog Ownership Function

  1. Changes
    - Fix type mismatch in the search_users_for_dog_ownership function
    - Add better error handling
    - Ensure proper casting of email field to text
    - Add explicit error handling to prevent crashes
  
  2. Security
    - Maintain security definer setting
    - Grant execute permission to authenticated users
*/

-- Drop and recreate the function with fixed return type and better error handling
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
DECLARE
  v_query text;
BEGIN
  -- Use a safer approach with explicit text casting
  v_query := $q$
    WITH existing_owners AS (
      SELECT profile_id
      FROM profile_dogs
      WHERE dog_id = $1
    )
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      u.email::text,
      (p.id IN (SELECT profile_id FROM existing_owners)) AS is_already_owner
    FROM 
      profiles p
      JOIN auth.users u ON p.id = u.id
    WHERE 
      (p.first_name ILIKE '%' || $2 || '%' OR
       p.last_name ILIKE '%' || $2 || '%' OR
       u.email::text ILIKE '%' || $2 || '%')
    ORDER BY 
      is_already_owner ASC,
      p.first_name ASC,
      p.last_name ASC
    LIMIT $3
  $q$;

  -- Execute the query with parameters
  RETURN QUERY EXECUTE v_query USING p_dog_id, p_search_query, p_limit;

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_users_for_dog_ownership TO authenticated;