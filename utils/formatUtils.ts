/**
 * Utility functions for formatting numbers, distances, and areas
 */

/**
 * Format a distance value with appropriate units (m or km)
 * @param meters Distance in meters
 * @returns Formatted string with appropriate unit
 */
export function formatDistance(meters: number): string {
  if (!meters || meters <= 0) {
    return '0 m';
  }
  
  if (meters < 1000) {
    // Under 1km, show in meters with no decimal places
    return `${Math.round(meters)} m`;
  } else {
    // Over 1km, show in kilometers with 1 decimal place
    const km = meters / 1000;
    // Format with thousand separator and decimal point
    return `${formatNumber(km, 1)} km`;
  }
}

/**
 * Format an area value with appropriate units (m², k m², or km²)
 * @param squareMeters Area in square meters
 * @returns Formatted string with appropriate unit
 */
export function formatArea(squareMeters: number): string {
  if (!squareMeters || squareMeters <= 0) {
    return '0 m²';
  }
  
  // For values between 10,000 and 1,000,000 m², show as k m²
  if (squareMeters >= 10000 && squareMeters < 1000000) {
    const kSquareMeters = squareMeters / 1000;
    return `${formatNumber(Math.round(kSquareMeters))}k m²`;
  } else if (squareMeters < 10000) {
    // Under 10k m², show in square meters with no decimal places
    return `${formatNumber(Math.round(squareMeters))} m²`;
  } else {
    // Convert to square kilometers (1 km² = 1,000,000 m²)
    const squareKm = squareMeters / 1000000;
    
    // For values that would display as 0.00 km², show in m² instead
    if (squareKm < 0.01) {
      return `${formatNumber(Math.round(squareMeters))} m²`;
    }
    
    // Otherwise show in square kilometers with 2 decimal places
    return `${formatNumber(squareKm, 2)} km²`;
  }
}

/**
 * Format a number with thousand separators and specified decimal places
 * @param value Number to format
 * @param decimalPlaces Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimalPlaces: number = 0): string {
  // Format with thousand separator (space) and decimal point (.)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: true,
  })
    .format(value)
    .replace(/,/g, ' '); // Replace commas with spaces for thousand separator
}