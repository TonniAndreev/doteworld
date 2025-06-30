/*
  # Fix Leaderboard and City Display Issues

  1. Changes
    - Drop and recreate the city leaderboard function with correct return types
    - Create a new function for updating profile city with proper name formatting
    - Fix type mismatches between numeric and double precision
    - Improve city similarity detection for better grouping

  2. Security
    - Maintain SECURITY DEFINER for proper access control
    - Grant appropriate permissions to authenticated users
*/

-- First, drop the existing function with CASCADE to ensure all dependencies are removed
DROP FUNCTION IF EXISTS get_city_leaderboard(uuid, text) CASCADE;

-- Create a function to get city leaderboard with combined similar cities
CREATE FUNCTION get_city_leaderboard(
  p_city_id uuid,
  p_category text DEFAULT 'territory'
)
RETURNS TABLE (
  profile_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  dog_name text,
  dog_photo_url text,
  territory_size double precision,
  total_distance double precision,
  badge_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  city_record record;
  similar_city_ids uuid[];
BEGIN
  -- Get the city record
  SELECT * INTO city_record FROM cities WHERE id = p_city_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'City not found';
  END IF;
  
  -- Find similar cities
  SELECT ARRAY_AGG(id) INTO similar_city_ids
  FROM cities
  WHERE 
    -- Similar name (using trigram similarity)
    SIMILARITY(LOWER(TRIM(name)), LOWER(TRIM(city_record.name))) > 0.7
    -- Same country
    AND LOWER(TRIM(country)) = LOWER(TRIM(city_record.country))
    -- Close geographic location (within ~10km)
    AND (
      6371 * acos(
        cos(radians(city_record.lat)) * 
        cos(radians(lat)) * 
        cos(radians(lon) - radians(city_record.lon)) + 
        sin(radians(city_record.lat)) * 
        sin(radians(lat))
      )
    ) < 10;
  
  -- Add the original city ID to the array if not already included
  IF NOT (p_city_id = ANY(similar_city_ids)) THEN
    similar_city_ids := ARRAY_APPEND(similar_city_ids, p_city_id);
  END IF;
  
  -- Return leaderboard data
  RETURN QUERY
  WITH profile_stats AS (
    -- Get territory size by city
    SELECT 
      pc.profile_id,
      SUM(pc.territory_size)::double precision AS territory_size
    FROM profile_cities pc
    WHERE pc.city_id = ANY(similar_city_ids)
    GROUP BY pc.profile_id
  ),
  walk_stats AS (
    -- Get total distance by city
    SELECT 
      pd.profile_id,
      SUM(ws.distance)::double precision AS total_distance
    FROM walk_sessions ws
    JOIN profile_dogs pd ON ws.dog_id = pd.dog_id
    WHERE ws.city_id = ANY(similar_city_ids)
      AND ws.status = 'completed'
    GROUP BY pd.profile_id
  ),
  badge_counts AS (
    -- Get badge counts
    SELECT 
      pa.profile_id,
      COUNT(*) AS badge_count
    FROM profile_achievements pa
    GROUP BY pa.profile_id
  ),
  dog_info AS (
    -- Get first dog for each profile
    SELECT DISTINCT ON (pd.profile_id)
      pd.profile_id,
      d.name AS dog_name,
      d.photo_url AS dog_photo_url
    FROM profile_dogs pd
    JOIN dogs d ON pd.dog_id = d.id
    ORDER BY pd.profile_id, pd.created_at
  )
  SELECT 
    p.id AS profile_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(di.dog_name, 'No dog') AS dog_name,
    di.dog_photo_url,
    COALESCE(ps.territory_size, 0::double precision) AS territory_size,
    COALESCE(ws.total_distance, 0::double precision) AS total_distance,
    COALESCE(bc.badge_count, 0) AS badge_count
  FROM profiles p
  LEFT JOIN profile_stats ps ON p.id = ps.profile_id
  LEFT JOIN walk_stats ws ON p.id = ws.profile_id
  LEFT JOIN badge_counts bc ON p.id = bc.profile_id
  LEFT JOIN dog_info di ON p.id = di.profile_id
  WHERE 
    CASE 
      WHEN p_category = 'territory' THEN COALESCE(ps.territory_size, 0) > 0
      WHEN p_category = 'distance' THEN COALESCE(ws.total_distance, 0) > 0
      ELSE true
    END
  ORDER BY
    CASE 
      WHEN p_category = 'territory' THEN COALESCE(ps.territory_size, 0)
      WHEN p_category = 'distance' THEN COALESCE(ws.total_distance, 0)
      WHEN p_category = 'achievements' THEN COALESCE(bc.badge_count, 0)
      ELSE COALESCE(ps.territory_size, 0)
    END DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_city_leaderboard TO authenticated;

-- Drop the existing update_profile_city function to avoid conflicts
DROP FUNCTION IF EXISTS update_profile_city(uuid);
DROP FUNCTION IF EXISTS update_profile_city(uuid, text);

-- Create a new function with a unique name for updating profile city with formatted name
CREATE FUNCTION update_profile_city_with_name(
  p_city_id uuid,
  p_city_name text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success boolean;
  actual_city_name text;
  city_country text;
BEGIN
  -- Input validation
  IF p_city_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get city name and country if not provided
  IF p_city_name IS NULL THEN
    SELECT name, country INTO actual_city_name, city_country
    FROM cities
    WHERE id = p_city_id;
    
    IF NOT FOUND THEN
      RETURN false;
    END IF;
  ELSE
    actual_city_name := p_city_name;
    
    -- Get country for the city
    SELECT country INTO city_country
    FROM cities
    WHERE id = p_city_id;
  END IF;

  -- Update the user's profile with city ID and formatted city name
  UPDATE profiles
  SET 
    current_city_id = p_city_id,
    current_city_name = actual_city_name || ', ' || city_country,
    updated_at = now()
  WHERE id = auth.uid();

  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_city_with_name TO authenticated;