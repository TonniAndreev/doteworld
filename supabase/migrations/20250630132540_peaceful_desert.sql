/*
  # Create Dog Owners View

  1. New View
    - `dog_owners_view`: Provides a comprehensive view of dog ownership relationships
    - Includes profile information, dog details, and ownership metadata
  
  2. Purpose
    - Reduces the number of queries needed to fetch dog ownership information
    - Improves performance for profile pages and dog management screens
    - Simplifies client-side code by providing pre-joined data
*/

-- Create a view for dog ownership relationships with user details
CREATE OR REPLACE VIEW dog_owners_view AS
SELECT 
  pd.dog_id,
  pd.profile_id,
  pd.role,
  pd.permissions,
  pd.created_at as ownership_since,
  pd.invited_by,
  p.first_name,
  p.last_name,
  p.avatar_url,
  d.name as dog_name,
  d.breed as dog_breed
FROM profile_dogs pd
JOIN profiles p ON pd.profile_id = p.id
JOIN dogs d ON pd.dog_id = d.id;

-- Grant access to the view
GRANT SELECT ON dog_owners_view TO authenticated;