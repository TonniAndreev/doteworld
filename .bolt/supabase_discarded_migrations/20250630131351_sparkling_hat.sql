/*
  # Fix Data Visibility and Query Optimization

  1. New Views
    - `public_user_stats`: Aggregates user profile data, dog info, and statistics for efficient querying
    - Updates to existing `city_leaderboard` view to fix territory calculation

  2. RLS Policy Updates
    - Add policies to allow viewing other users' walk sessions and achievements
    - Fix existing policies for better data visibility

  3. Optimizations
    - Create indexes to improve query performance
*/

-- Create a public_user_stats view for efficient user data fetching
CREATE OR REPLACE VIEW public.public_user_stats AS
WITH user_dog_info AS (
    SELECT
        pd.profile_id,
        d.id AS dog_id,
        d.name AS dog_name,
        d.breed AS dog_breed,
        d.photo_url AS dog_photo_url,
        ROW_NUMBER() OVER (PARTITION BY pd.profile_id ORDER BY d.created_at) as rn -- Get primary dog (first created)
    FROM
        public.profile_dogs pd
    JOIN
        public.dogs d ON pd.dog_id = d.id
),
user_walk_stats AS (
    SELECT
        pd.profile_id,
        COALESCE(SUM(ws.territory_gained), 0) AS territory_size,
        COALESCE(SUM(ws.distance), 0) AS total_distance,
        COUNT(DISTINCT ws.id) AS total_walks,
        MAX(ws.ended_at) AS last_walk_date
    FROM
        public.profile_dogs pd
    JOIN
        public.walk_sessions ws ON pd.dog_id = ws.dog_id AND ws.status = 'completed'
    GROUP BY
        pd.profile_id
),
user_badge_stats AS (
    SELECT
        profile_id,
        COUNT(*) AS badge_count
    FROM
        public.profile_achievements
    WHERE
        obtained_at IS NOT NULL
    GROUP BY
        profile_id
)
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.created_at,
    p.current_city_id,
    p.current_city_name,
    udi.dog_id AS primary_dog_id,
    udi.dog_name AS primary_dog_name,
    udi.dog_breed AS primary_dog_breed,
    udi.dog_photo_url AS primary_dog_photo_url,
    COALESCE(uws.territory_size, 0) AS territory_size,
    COALESCE(uws.total_distance, 0) AS total_distance,
    COALESCE(uws.total_walks, 0) AS total_walks,
    uws.last_walk_date,
    COALESCE(ubs.badge_count, 0) AS badge_count
FROM
    public.profiles p
LEFT JOIN
    user_dog_info udi ON p.id = udi.profile_id AND udi.rn = 1 -- Join with primary dog info
LEFT JOIN
    user_walk_stats uws ON p.id = uws.profile_id
LEFT JOIN
    user_badge_stats ubs ON p.id = ubs.profile_id;

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

-- Grant access to the views
GRANT SELECT ON public.public_user_stats TO authenticated;
GRANT SELECT ON public.public_user_stats TO anon;
GRANT SELECT ON public.city_leaderboard TO authenticated;
GRANT SELECT ON public.city_leaderboard TO anon;

-- Add RLS policies to allow viewing other users' walk sessions
CREATE POLICY "Users can view all completed walk sessions" 
ON public.walk_sessions
FOR SELECT
TO authenticated
USING (status = 'completed');

-- Add RLS policies to allow viewing other users' achievements
CREATE POLICY "Users can view all completed achievements" 
ON public.profile_achievements
FOR SELECT
TO authenticated
USING (obtained_at IS NOT NULL);

-- Add RLS policies to allow viewing all dogs
CREATE POLICY "Users can view all dogs" 
ON public.dogs
FOR SELECT
TO authenticated
USING (true);

-- Add index to improve performance of city leaderboard queries
CREATE INDEX IF NOT EXISTS idx_walk_sessions_city_status 
ON public.walk_sessions(city_id, status);

-- Add index to improve performance of profile achievements queries
CREATE INDEX IF NOT EXISTS idx_profile_achievements_obtained 
ON public.profile_achievements(profile_id, obtained_at) 
WHERE obtained_at IS NOT NULL;