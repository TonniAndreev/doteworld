import * as Location from 'expo-location';
import { supabase } from '@/utils/supabase';

interface CityDetails {
  name: string;
  state: string | null;
  country: string;
  lat: number;
  lon: number;
}

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
  distance_km?: number;
}

/**
 * Reverse geocode coordinates to get city details
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Promise resolving to city details or null if geocoding fails
 */
export async function reverseGeocodeToCity(
  latitude: number,
  longitude: number
): Promise<CityDetails | null> {
  try {
    console.log(`Reverse geocoding coordinates: ${latitude}, ${longitude}`);
    
    // Use Expo Location for reverse geocoding
    const geocodeResult = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (!geocodeResult || geocodeResult.length === 0) {
      console.log('No geocode results found');
      return null;
    }
    
    const location = geocodeResult[0];
    console.log('Geocode result:', location);
    
    // Extract city details
    // Note: field names may vary by platform and region
    const city = location.city || location.subregion || location.district;
    const state = location.region;
    const country = location.country;
    
    if (!city || !country) {
      console.log('Missing required city information');
      return null;
    }
    
    return {
      name: city,
      state,
      country,
      lat: latitude,
      lon: longitude
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
}

/**
 * Get or create a city record in Supabase
 * @param cityDetails City details object
 * @returns Promise resolving to the city ID
 */
export async function getOrCreateCityInSupabase(
  cityDetails: CityDetails
): Promise<string | null> {
  try {
    console.log('Getting or creating city in Supabase:', cityDetails);
    
    // Call the RPC function to get or create the city
    const { data, error } = await supabase.rpc('get_or_create_city', {
      city_name: cityDetails.name,
      city_state: cityDetails.state,
      city_country: cityDetails.country,
      city_lat: cityDetails.lat,
      city_lon: cityDetails.lon
    });
    
    if (error) {
      console.error('Error getting or creating city:', error);
      return null;
    }
    
    console.log('City ID:', data);
    return data;
  } catch (error) {
    console.error('Error in getOrCreateCityInSupabase:', error);
    return null;
  }
}

/**
 * Find the nearest city to the given coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param maxDistanceKm Maximum distance in kilometers (default: 50)
 * @returns Promise resolving to the nearest city or null if none found
 */
export async function findNearestCity(
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 50
): Promise<City | null> {
  try {
    console.log(`Finding nearest city to: ${latitude}, ${longitude}`);
    
    // Call the RPC function to find the nearest city
    const { data, error } = await supabase.rpc('find_nearest_city', {
      p_lat: latitude,
      p_lon: longitude,
      p_max_distance_km: maxDistanceKm
    });
    
    if (error) {
      console.error('Error finding nearest city:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('No nearby cities found');
      return null;
    }
    
    console.log('Nearest city:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error in findNearestCity:', error);
    return null;
  }
}

/**
 * Update the current user's city
 * @param cityId City ID to set as current
 * @returns Promise resolving to success status
 */
export async function updateUserCity(cityId: string): Promise<boolean> {
  try {
    console.log('Updating user city to:', cityId);
    
    // Call the RPC function to update the user's city
    const { data, error } = await supabase.rpc('update_profile_city', {
      city_id: cityId
    });
    
    if (error) {
      console.error('Error updating user city:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in updateUserCity:', error);
    return false;
  }
}

/**
 * Add territory to a user's city record
 * @param cityId City ID
 * @param territorySize Territory size to add
 * @returns Promise resolving to success status
 */
export async function addTerritoryToCity(
  cityId: string,
  territorySize: number
): Promise<boolean> {
  try {
    console.log(`Adding ${territorySize} territory to city ${cityId}`);
    
    // Call the RPC function to add territory to the city
    const { data, error } = await supabase.rpc('add_territory_to_city', {
      p_city_id: cityId,
      p_territory_size: territorySize
    });
    
    if (error) {
      console.error('Error adding territory to city:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in addTerritoryToCity:', error);
    return false;
  }
}

/**
 * Get all cities where the current user has territory
 * @returns Promise resolving to an array of cities
 */
export async function getUserCities(): Promise<City[]> {
  try {
    console.log('Getting user cities');
    
    // Query the profile_cities table to get cities where the user has territory
    const { data, error } = await supabase
      .from('profile_cities')
      .select(`
        city_id,
        territory_size,
        last_conquered_at,
        cities (
          id,
          name,
          state,
          country
        )
      `)
      .order('last_conquered_at', { ascending: false });
    
    if (error) {
      console.error('Error getting user cities:', error);
      return [];
    }
    
    // Format the data
    return (data || []).map(item => ({
      id: item.cities.id,
      name: item.cities.name,
      state: item.cities.state,
      country: item.cities.country,
      territorySize: item.territory_size
    }));
  } catch (error) {
    console.error('Error in getUserCities:', error);
    return [];
  }
}