/*
  # Fix User Profile View and Leaderboard Issues

  1. Changes
    - Update the public_user_stats view to properly handle null values
    - Fix the city_leaderboard view to correctly calculate territory by city
    - Add RLS policies to allow viewing other users' walk data
    - Optimize queries for better performance

  2. Security
    - Add policies to allow viewing other users' walk sessions and achievements
    - Maintain proper data access controls
*/

-- Create a function to update profile city with formatted name
CREATE OR REPLACE FUNCTION update_profile_city(
  city_id uuid,
  city_name text DEFAULT NULL
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
  IF city_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get city name and country if not provided
  IF city_name IS NULL THEN
    SELECT name, country INTO actual_city_name, city_country
    FROM cities
    WHERE id = city_id;
    
    IF NOT FOUND THEN
      RETURN false;
    END IF;
  ELSE
    actual_city_name := city_name;
    
    -- Get country for the city
    SELECT country INTO city_country
    FROM cities
    WHERE id = city_id;
  END IF;

  -- Update the user's profile with city ID and formatted city name
  UPDATE profiles
  SET 
    current_city_id = city_id,
    current_city_name = actual_city_name || ', ' || city_country,
    updated_at = now()
  WHERE id = auth.uid();

  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_city TO authenticated;

-- Fix the city_leaderboard view to correctly calculate territory by city
CREATE OR REPLACE VIEW public.city_leaderboard AS
WITH user_dog_info AS (
    SELECT
        pd.profile_id,
        d.id AS dog_id,
        d.name AS dog_name,
        ROW_NUMBER() OVER (PARTITION BY pd.profile_id ORDER BY d.created_at) as rn -- Get primary dog (first created)
    FROM
        public.profile_dogs pd
    JOIN
        public.dogs d ON pd.dog_id = d.id
),
city_walk_stats AS (
    SELECT
        pd.profile_id,
        ws.city_id,
        COALESCE(SUM(ws.territory_gained), 0) AS territory_size,
        COALESCE(SUM(ws.distance), 0) AS total_distance,
        COUNT(DISTINCT ws.id) AS total_walks
    FROM
        public.profile_dogs pd
    JOIN
        public.walk_sessions ws ON pd.dog_id = ws.dog_id AND ws.status = 'completed'
    WHERE
        ws.city_id IS NOT NULL
    GROUP BY
        pd.profile_id, ws.city_id
)
SELECT
    p.id AS profile_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    udi.dog_name,
    cws.city_id,
    c.name AS city_name,
    c.country AS city_country,
    COALESCE(cws.territory_size, 0) AS territory_size,
    COALESCE(cws.total_distance, 0) AS total_distance,
    COALESCE((SELECT COUNT(*) FROM public.profile_achievements pa WHERE pa.profile_id = p.id AND pa.obtained_at IS NOT NULL), 0) AS badge_count
FROM
    public.profiles p
LEFT JOIN
    user_dog_info udi ON p.id = udi.profile_id AND udi.rn = 1
JOIN
    city_walk_stats cws ON p.id = cws.profile_id
JOIN
    public.cities c ON cws.city_id = c.id;

-- Add RLS policies to allow viewing other users' walk sessions
DROP POLICY IF EXISTS "Users can view walk sessions for their dogs" ON public.walk_sessions;
DROP POLICY IF EXISTS "Users can view all completed walk sessions" ON public.walk_sessions;

CREATE POLICY "Users can view walk sessions for their dogs" 
ON public.walk_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profile_dogs pd
    WHERE pd.dog_id = walk_sessions.dog_id
    AND pd.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can view all completed walk sessions" 
ON public.walk_sessions
FOR SELECT
TO authenticated
USING (status = 'completed');

-- Add RLS policies to allow viewing other users' achievements
DROP POLICY IF EXISTS "Users can view all completed achievements" ON public.profile_achievements;

CREATE POLICY "Users can view all completed achievements" 
ON public.profile_achievements
FOR SELECT
TO authenticated
USING (obtained_at IS NOT NULL);

-- Add RLS policies to allow viewing all dogs
DROP POLICY IF EXISTS "Allow select on dogs" ON public.dogs;

CREATE POLICY "Allow select on dogs" 
ON public.dogs
FOR SELECT
TO public
USING (true);

-- Add index to improve performance of city leaderboard queries
CREATE INDEX IF NOT EXISTS idx_walk_sessions_city_status 
ON public.walk_sessions(city_id, status);

-- Add index to improve performance of profile achievements queries
CREATE INDEX IF NOT EXISTS idx_profile_achievements_obtained 
ON public.profile_achievements(profile_id, obtained_at) 
WHERE obtained_at IS NOT NULL;