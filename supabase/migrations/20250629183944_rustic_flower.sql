/*
  # Dog Owners View

  1. New Views
    - `dog_owners_view` - Provides a consolidated view of dog owners with profile information

  2. Purpose
    - Simplifies querying dog ownership information
    - Includes profile details for each owner
    - Used for displaying dog ownership in the UI
*/

-- Create a view to show dog owners with their profile information
CREATE OR REPLACE VIEW dog_owners_view AS
SELECT
  pd.dog_id,
  pd.profile_id,
  pd.role,
  pd.permissions,
  pd.created_at AS ownership_since,
  pd.invited_by,
  p.first_name,
  p.last_name,
  p.avatar_url,
  d.name AS dog_name,
  d.breed AS dog_breed
FROM
  profile_dogs pd
JOIN
  profiles p ON pd.profile_id = p.id
JOIN
  dogs d ON pd.dog_id = d.id
ORDER BY
  CASE 
    WHEN pd.role = 'owner' THEN 1
    WHEN pd.role = 'co-owner' THEN 2
    WHEN pd.role = 'caretaker' THEN 3
    ELSE 4
  END,
  pd.created_at;

-- Grant select permissions to authenticated users
GRANT SELECT ON dog_owners_view TO authenticated;