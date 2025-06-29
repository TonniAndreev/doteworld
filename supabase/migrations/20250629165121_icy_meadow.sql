/*
  # Fix walk_points structure with path_coordinates

  1. New Columns
    - `path_coordinates` (jsonb): JSON array of coordinates for the walk path
  
  2. Indexes
    - Added GIN index on path_coordinates for better query performance
  
  3. Functions
    - Created extract_coordinates function to parse the JSON coordinates
  
  4. Views
    - Created walk_points_expanded view for backward compatibility
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
  wp.start_time,
  coords.latitude,
  coords.longitude
FROM 
  walk_points wp,
  LATERAL extract_coordinates(wp.path_coordinates) AS coords;

-- Add comment explaining the new structure
COMMENT ON COLUMN walk_points.path_coordinates IS 
'JSON array of coordinates for the walk path. Each element contains latitude and longitude.';