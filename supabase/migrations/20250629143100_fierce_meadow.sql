/*
  # Update walk_points table to use JSON for coordinates

  1. Changes
    - Add `path_coordinates` JSONB column to store all coordinates for a walk
    - Keep existing latitude/longitude columns for backward compatibility
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data integrity
*/

-- Add path_coordinates column to walk_points table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walk_points' AND column_name = 'path_coordinates'
  ) THEN
    ALTER TABLE walk_points ADD COLUMN path_coordinates JSONB;
  END IF;
END $$;

-- Create index for better performance when querying by path_coordinates
CREATE INDEX IF NOT EXISTS idx_walk_points_path_coordinates ON walk_points USING GIN (path_coordinates);

-- Create a function to extract coordinates from path_coordinates
CREATE OR REPLACE FUNCTION extract_coordinates(path JSONB)
RETURNS TABLE (latitude FLOAT8, longitude FLOAT8) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (coord->>'latitude')::FLOAT8 AS latitude,
    (coord->>'longitude')::FLOAT8 AS longitude
  FROM jsonb_array_elements(path) AS coord;
END;
$$ LANGUAGE plpgsql;

-- Create a view for backward compatibility
CREATE OR REPLACE VIEW walk_points_expanded AS
SELECT 
  wp.id,
  wp.dog_id,
  wp.walk_session_id,
  wp.timestamp,
  coords.latitude,
  coords.longitude
FROM 
  walk_points wp,
  LATERAL extract_coordinates(wp.path_coordinates) AS coords;

-- Add comment explaining the new structure
COMMENT ON COLUMN walk_points.path_coordinates IS 
'JSON array of coordinates for the walk path. Each element contains latitude and longitude.';