/*
  # Create dog_owners_view

  1. New Views
    - `dog_owners_view` - A view that joins profile_dogs with profiles to show dog ownership information
  
  2. Purpose
    - Provides a convenient way to query dog ownership information with owner details
    - Used by the app to display dog owners in the UI
*/

-- Drop the view if it exists to avoid errors when recreating
DROP VIEW IF EXISTS dog_owners_view;

-- Create the view with proper joins
CREATE VIEW dog_owners_view AS
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
  dogs d ON pd.dog_id = d.id;

-- Add comment to the view
COMMENT ON VIEW dog_owners_view IS 'View that shows dog ownership information with owner details';