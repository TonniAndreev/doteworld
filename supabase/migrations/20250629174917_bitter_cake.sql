/*
  # Drop walk_points_expanded view and extract_coordinates function

  1. Changes
    - Drop the walk_points_expanded view which is no longer needed
    - Drop the extract_coordinates function which is no longer needed
    - Clean up database objects related to the old coordinate storage approach
*/

-- Drop the walk_points_expanded view if it exists
DROP VIEW IF EXISTS walk_points_expanded;

-- Drop the extract_coordinates function if it exists
DROP FUNCTION IF EXISTS extract_coordinates(JSONB);