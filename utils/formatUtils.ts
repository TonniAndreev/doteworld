/**
 * Format a territory size value with appropriate units
 * @param size Territory size in square kilometers
 * @returns Formatted string with appropriate units (m² or km²)
 */
export function formatTerritorySize(size: number): string {
  if (size === 0) return '0 m²';
  
  // Convert to square meters for display
  const sizeInSquareMeters = size * 1000000;
  
  // If less than 1 square kilometer, show in square meters
  if (sizeInSquareMeters < 1000000) {
    return `${Math.round(sizeInSquareMeters)} m²`;
  }
  
  // Otherwise show in square kilometers with 2 decimal places
  return `${size.toFixed(2)} km²`;
}

/**
 * Format a distance value with appropriate units
 * @param distance Distance in kilometers
 * @returns Formatted string with appropriate units (m or km)
 */
export function formatDistance(distance: number): string {
  if (distance === 0) return '0 m';
  
  // Convert to meters for display
  const distanceInMeters = distance * 1000;
  
  // If less than 1 kilometer, show in meters
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  
  // Otherwise show in kilometers with 2 decimal places
  return `${distance.toFixed(2)} km`;
}

/**
 * Format a city name with country
 * @param name City name
 * @param country Country name
 * @returns Formatted city name with country
 */
export function formatCityName(name: string | null, country: string | null): string {
  if (!name) return 'Unknown Location';
  if (!country) return name;
  return `${name}, ${country}`;
}