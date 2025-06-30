/*
  # Add current_city_name column to profiles table

  1. Changes
    - Add `current_city_name` column to profiles table
    - This column stores the formatted city name with country (e.g., "Sofia, Bulgaria")
    - Used by the public_user_stats view and other queries

  2. Security
    - No changes to existing RLS policies needed
    - Column follows same access patterns as other profile data
*/

-- Add current_city_name column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_city_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_city_name text;
  END IF;
END $$;

-- Update the public_user_stats view to include the current_city_name column
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

-- Grant access to the view
GRANT SELECT ON public.public_user_stats TO authenticated;
GRANT SELECT ON public.public_user_stats TO anon;