/*
  # Create Walk Statistics Views

  1. New Views
    - `walk_statistics`: Aggregates dog walking statistics
    - `user_walk_statistics`: Aggregates user walking statistics
  
  2. Purpose
    - Provides efficient access to aggregated walking data
    - Reduces the number of database queries needed for statistics
    - Improves performance for profile and leaderboard pages
*/

-- Create a view for dog walking statistics
CREATE OR REPLACE VIEW walk_statistics AS
SELECT
    d.id AS dog_id,
    d.name AS dog_name,
    COUNT(DISTINCT ws.id) AS total_walks,
    COALESCE(SUM(ws.distance), 0) AS total_distance,
    COALESCE(SUM(ws.territory_gained), 0) AS total_territory_gained,
    COALESCE(SUM(ws.points_count), 0) AS total_points,
    MAX(ws.ended_at) AS last_walk_date
FROM
    dogs d
LEFT JOIN
    walk_sessions ws ON d.id = ws.dog_id AND ws.status = 'completed'
GROUP BY
    d.id, d.name;

-- Create a view for user walking statistics
CREATE OR REPLACE VIEW user_walk_statistics AS
SELECT
    pd.profile_id AS user_id,
    COUNT(DISTINCT ws.id) AS total_walks,
    COALESCE(SUM(ws.distance), 0) AS total_distance,
    COALESCE(SUM(ws.territory_gained), 0) AS total_territory,
    COALESCE(SUM(EXTRACT(EPOCH FROM (ws.ended_at - ws.started_at)) / 60), 0)::bigint AS total_duration,
    MAX(ws.ended_at) AS last_walk_date
FROM
    profile_dogs pd
JOIN
    dogs d ON pd.dog_id = d.id
LEFT JOIN
    walk_sessions ws ON d.id = ws.dog_id AND ws.status = 'completed'
GROUP BY
    pd.profile_id;

-- Grant access to the views
GRANT SELECT ON walk_statistics TO authenticated;
GRANT SELECT ON user_walk_statistics TO authenticated;