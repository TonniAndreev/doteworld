/*
  # Fix Territory Functions

  1. Changes
     - Fix the `add_territory_to_city` function to properly handle territory updates
     - Fix the `update_monthly_territory_size` trigger function to resolve type mismatch errors
     - Ensure proper type casting for numeric operations

  2. Security
     - No changes to security policies
*/

-- Fix the add_territory_to_city function
CREATE OR REPLACE FUNCTION public.add_territory_to_city(
  p_city_id UUID,
  p_territory_size NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_profile_id UUID;
  v_current_size NUMERIC;
BEGIN
  -- Get the current user's ID
  v_profile_id := auth.uid();
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if the profile already has a record for this city
  SELECT territory_size INTO v_current_size
  FROM profile_cities
  WHERE profile_id = v_profile_id AND city_id = p_city_id;
  
  IF v_current_size IS NULL THEN
    -- Insert new record if none exists
    INSERT INTO profile_cities (
      profile_id,
      city_id,
      territory_size,
      last_conquered_at
    ) VALUES (
      v_profile_id,
      p_city_id,
      p_territory_size,
      NOW()
    );
  ELSE
    -- Update existing record
    UPDATE profile_cities
    SET 
      territory_size = v_current_size + p_territory_size,
      last_conquered_at = NOW()
    WHERE 
      profile_id = v_profile_id AND 
      city_id = p_city_id;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in add_territory_to_city: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the update_monthly_territory_size trigger function
CREATE OR REPLACE FUNCTION public.update_monthly_territory_size()
RETURNS TRIGGER AS $$
DECLARE
  v_dog_owner_id UUID;
  v_current_month TEXT;
  v_last_reset_month TEXT;
  v_territory_gained NUMERIC;
  v_current_territory_size NUMERIC;
BEGIN
  -- Only process when status changes to 'completed'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') OR
     (TG_OP = 'INSERT' AND NEW.status = 'completed') THEN
    
    -- Get the dog owner's profile ID
    SELECT profile_id INTO v_dog_owner_id
    FROM profile_dogs
    WHERE dog_id = NEW.dog_id AND role = 'owner'
    LIMIT 1;
    
    IF v_dog_owner_id IS NULL THEN
      RAISE NOTICE 'No owner found for dog %', NEW.dog_id;
      RETURN NEW;
    END IF;
    
    -- Get the territory gained from this walk session
    v_territory_gained := COALESCE(NEW.territory_gained, 0);
    
    -- Get current month in YYYY-MM format
    v_current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Get the user's last reset month
    SELECT last_reset_month INTO v_last_reset_month
    FROM profiles
    WHERE id = v_dog_owner_id;
    
    -- Get current monthly territory size
    SELECT monthly_territory_size INTO v_current_territory_size
    FROM profiles
    WHERE id = v_dog_owner_id;
    
    -- Ensure we have a numeric value
    v_current_territory_size := COALESCE(v_current_territory_size, 0);
    
    -- If this is a new month, reset the territory size
    IF v_last_reset_month IS NULL OR v_last_reset_month != v_current_month THEN
      -- Update the last reset month and set territory to the new gained amount
      UPDATE profiles
      SET 
        last_reset_month = v_current_month,
        monthly_territory_size = v_territory_gained
      WHERE id = v_dog_owner_id;
      
      RAISE NOTICE 'Reset monthly territory for user % to %', v_dog_owner_id, v_territory_gained;
    ELSE
      -- Add to the existing monthly territory
      UPDATE profiles
      SET monthly_territory_size = v_current_territory_size + v_territory_gained
      WHERE id = v_dog_owner_id;
      
      RAISE NOTICE 'Updated monthly territory for user % to %', v_dog_owner_id, (v_current_territory_size + v_territory_gained);
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in update_monthly_territory_size: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS update_monthly_territory_size_trigger ON walk_sessions;
CREATE TRIGGER update_monthly_territory_size_trigger
AFTER INSERT OR UPDATE OF status ON walk_sessions
FOR EACH ROW
EXECUTE FUNCTION update_monthly_territory_size();