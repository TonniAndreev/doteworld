/*
  # Improve City Name Normalization and Leaderboard

  1. Changes
    - Update get_or_create_city function to normalize city names
    - Add function to find similar city names
    - Improve city lookup to handle different spellings of the same city
    - Ensure all walks are properly associated with cities

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Update the get_or_create_city function to normalize city names
CREATE OR REPLACE FUNCTION get_or_create_city(
  city_name text,
  city_state text,
  city_country text,
  city_lat numeric,
  city_lon numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  city_id uuid;
  normalized_name text;
  normalized_state text;
  normalized_country text;
BEGIN
  -- Input validation
  IF city_name IS NULL OR city_country IS NULL OR city_lat IS NULL OR city_lon IS NULL THEN
    RAISE EXCEPTION 'City name, country, latitude, and longitude are required';
  END IF;

  -- Normalize city name, state, and country
  normalized_name = LOWER(TRIM(city_name));
  normalized_name = REGEXP_REPLACE(normalized_name, '\s+(city|grad|municipality|town|village)$', '', 'i');
  
  IF city_state IS NOT NULL THEN
    normalized_state = LOWER(TRIM(city_state));
  ELSE
    normalized_state = NULL;
  END IF;
  
  normalized_country = LOWER(TRIM(city_country));

  -- First try exact match with normalized values
  SELECT id INTO city_id
  FROM cities
  WHERE LOWER(TRIM(name)) = normalized_name
    AND (normalized_state IS NULL OR LOWER(TRIM(state)) = normalized_state)
    AND LOWER(TRIM(country)) = normalized_country;

  -- If no exact match, try fuzzy match based on name similarity and location
  IF city_id IS NULL THEN
    -- Find cities with similar names in the same country
    SELECT id INTO city_id
    FROM cities
    WHERE 
      -- Similar name (using trigram similarity)
      SIMILARITY(LOWER(TRIM(name)), normalized_name) > 0.7
      -- Same country
      AND LOWER(TRIM(country)) = normalized_country
      -- Close geographic location (within ~10km)
      AND (
        6371 * acos(
          cos(radians(city_lat)) * 
          cos(radians(lat)) * 
          cos(radians(lon) - radians(city_lon)) + 
          sin(radians(city_lat)) * 
          sin(radians(lat))
        )
      ) < 10
    ORDER BY 
      SIMILARITY(LOWER(TRIM(name)), normalized_name) DESC,
      (
        6371 * acos(
          cos(radians(city_lat)) * 
          cos(radians(lat)) * 
          cos(radians(lon) - radians(city_lon)) + 
          sin(radians(city_lat)) * 
          sin(radians(lat))
        )
      ) ASC
    LIMIT 1;
  END IF;

  -- If city doesn't exist, create it
  IF city_id IS NULL THEN
    INSERT INTO cities (name, state, country, lat, lon)
    VALUES (city_name, city_state, city_country, city_lat, city_lon)
    RETURNING id INTO city_id;
  END IF;

  RETURN city_id;
END;
$$;

-- Create a function to find similar cities
CREATE OR REPLACE FUNCTION find_similar_cities(
  p_city_name text,
  p_country text,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  state text,
  country text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_name text;
  normalized_country text;
BEGIN
  -- Normalize inputs
  normalized_name = LOWER(TRIM(p_city_name));
  normalized_name = REGEXP_REPLACE(normalized_name, '\s+(city|grad|municipality|town|village)$', '', 'i');
  
  normalized_country = LOWER(TRIM(p_country));

  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.state,
    c.country,
    SIMILARITY(LOWER(TRIM(c.name)), normalized_name) AS similarity
  FROM cities c
  WHERE 
    SIMILARITY(LOWER(TRIM(c.name)), normalized_name) > 0.4
    AND LOWER(TRIM(c.country)) = normalized_country
  ORDER BY 
    similarity DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_similar_cities TO authenticated;

-- Create a function to get city leaderboard with combined similar cities
CREATE OR REPLACE FUNCTION get_city_leaderboard(
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
  territory_size numeric,
  total_distance numeric,
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
  FROM find_similar_cities(city_record.name, city_record.country, 10)
  WHERE similarity > 0.7;
  
  -- Add the original city ID to the array
  similar_city_ids := ARRAY_APPEND(similar_city_ids, p_city_id);
  
  -- Return leaderboard data
  RETURN QUERY
  WITH profile_stats AS (
    -- Get territory size by city
    SELECT 
      pc.profile_id,
      SUM(pc.territory_size) AS territory_size
    FROM profile_cities pc
    WHERE pc.city_id = ANY(similar_city_ids)
    GROUP BY pc.profile_id
  ),
  walk_stats AS (
    -- Get total distance by city
    SELECT 
      pd.profile_id,
      SUM(ws.distance) AS total_distance
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
    di.dog_name,
    di.dog_photo_url,
    COALESCE(ps.territory_size, 0) AS territory_size,
    COALESCE(ws.total_distance, 0) AS total_distance,
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

-- Create extension for text similarity if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;