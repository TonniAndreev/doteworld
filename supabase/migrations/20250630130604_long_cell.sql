/*
  # Create City Leaderboard View

  1. New Views
    - `city_leaderboard`: Aggregates user statistics by city for leaderboard display
      - Includes profile information, dog name, city details, and aggregated statistics
      - Used for efficient leaderboard queries filtered by city

  2. Purpose
    - Provides optimized data access for city-specific leaderboards
    - Aggregates territory size, distance walked, and achievement counts
    - Joins profile, dog, and city information for complete leaderboard entries
*/

-- Create the city_leaderboard view for efficient leaderboard queries
CREATE OR REPLACE VIEW public.city_leaderboard AS
WITH user_dog_info AS (
    SELECT
        pd.profile_id,
        d.name AS dog_name,
        ROW_NUMBER() OVER (PARTITION BY pd.profile_id ORDER BY d.created_at) as rn -- Get primary dog (first created)
    FROM
        public.profile_dogs pd
    JOIN
        public.dogs d ON pd.dog_id = d.id
)
SELECT
    p.id AS profile_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    udi.dog_name, -- Primary dog's name
    c.id AS city_id,
    c.name AS city_name,
    c.country AS city_country,
    COALESCE(SUM(ws.territory_gained), 0) AS territory_size,
    COALESCE(SUM(ws.distance), 0) AS total_distance,
    COUNT(DISTINCT pa.achievement_id) AS badge_count
FROM
    public.profiles p
LEFT JOIN
    user_dog_info udi ON p.id = udi.profile_id AND udi.rn = 1 -- Join with primary dog info
LEFT JOIN
    public.profile_dogs pd ON p.id = pd.profile_id
LEFT JOIN
    public.dogs d_all ON pd.dog_id = d_all.id -- Use d_all for joining to walk_sessions
LEFT JOIN
    public.walk_sessions ws ON d_all.id = ws.dog_id AND ws.status = 'completed'
LEFT JOIN
    public.cities c ON ws.city_id = c.id
LEFT JOIN
    public.profile_achievements pa ON p.id = pa.profile_id AND pa.obtained_at IS NOT NULL
GROUP BY
    p.id, p.first_name, p.last_name, p.avatar_url, udi.dog_name, c.id, c.name, c.country;

-- Grant access to the view
GRANT SELECT ON public.city_leaderboard TO authenticated;
GRANT SELECT ON public.city_leaderboard TO anon;