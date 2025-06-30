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
 * Format an area value with appropriate units (m² or km²)
 * @param squareMeters Area in square meters
 * @returns Formatted string with appropriate unit
 */
export function formatArea(squareMeters: number): string {
  if (!squareMeters || squareMeters <= 0) {
    return '0 m²';
  }
  
  if (squareMeters < 1000000) {
    // Under 1km², show in square meters with no decimal places
    return `${formatNumber(Math.round(squareMeters))} m²`;
  } else {
    // Over 1km², show in square kilometers with 2 decimal places
    // Round up to ensure we don't show smaller values than actual
    const squareKm = Math.ceil(squareMeters / 1000000 * 100) / 100;
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