/*
  # Create city-related functions

  1. New Functions
    - `get_or_create_city` RPC function to safely get or create city records
    - `update_profile_city` function to update a user's current city
    - `add_territory_to_city` function to track territory by city

  2. Security
    - Functions use SECURITY DEFINER to ensure proper access control
    - Input validation to prevent data corruption
*/

-- Function to get or create a city
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
BEGIN
  -- Input validation
  IF city_name IS NULL OR city_country IS NULL OR city_lat IS NULL OR city_lon IS NULL THEN
    RAISE EXCEPTION 'City name, country, latitude, and longitude are required';
  END IF;

  -- Try to find existing city
  SELECT id INTO city_id
  FROM cities
  WHERE name = city_name
    AND (city_state IS NULL OR state = city_state)
    AND country = city_country;

  -- If city doesn't exist, create it
  IF city_id IS NULL THEN
    INSERT INTO cities (name, state, country, lat, lon)
    VALUES (city_name, city_state, city_country, city_lat, city_lon)
    RETURNING id INTO city_id;
  END IF;

  RETURN city_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_city TO authenticated;

-- Function to update a user's current city
CREATE OR REPLACE FUNCTION update_profile_city(
  city_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success boolean;
BEGIN
  -- Input validation
  IF city_id IS NULL THEN
    RETURN false;
  END IF;

  -- Update the user's profile
  UPDATE profiles
  SET current_city_id = city_id,
      updated_at = now()
  WHERE id = auth.uid();

  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_city TO authenticated;

-- Function to add territory to a user's city record
CREATE OR REPLACE FUNCTION add_territory_to_city(
  p_city_id uuid,
  p_territory_size numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success boolean;
BEGIN
  -- Input validation
  IF p_city_id IS NULL OR p_territory_size <= 0 THEN
    RETURN false;
  END IF;

  -- Insert or update the profile_cities record
  INSERT INTO profile_cities (profile_id, city_id, territory_size, last_conquered_at)
  VALUES (auth.uid(), p_city_id, p_territory_size, now())
  ON CONFLICT (profile_id, city_id) 
  DO UPDATE SET 
    territory_size = profile_cities.territory_size + p_territory_size,
    last_conquered_at = now();

  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_territory_to_city TO authenticated;

-- Function to find the nearest city
CREATE OR REPLACE FUNCTION find_nearest_city(
  p_lat numeric,
  p_lon numeric,
  p_max_distance_km numeric DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  state text,
  country text,
  distance_km numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.state,
    c.country,
    -- Calculate distance using the Haversine formula
    (
      6371 * acos(
        cos(radians(p_lat)) * 
        cos(radians(c.lat)) * 
        cos(radians(c.lon) - radians(p_lon)) + 
        sin(radians(p_lat)) * 
        sin(radians(c.lat))
      )
    ) AS distance_km
  FROM cities c
  WHERE (
    6371 * acos(
      cos(radians(p_lat)) * 
      cos(radians(c.lat)) * 
      cos(radians(c.lon) - radians(p_lon)) + 
      sin(radians(p_lat)) * 
      sin(radians(c.lat))
    )
  ) <= p_max_distance_km
  ORDER BY distance_km
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_nearest_city TO authenticated;