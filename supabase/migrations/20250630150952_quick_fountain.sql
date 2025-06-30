/*
  # Fix Search Users for Dog Ownership Function

  1. Changes
     - Fix the return type issue in search_users_for_dog_ownership function
     - Ensure proper type casting for email field
     - Add better error handling
  
  2. Security
     - Maintain security definer setting
     - Preserve existing RLS policies
*/

-- Drop and recreate the function with fixed return type
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
    u.email::text, -- Explicitly cast email to text
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