import * as turf from '@turf/turf';

// Existing distance calculation function
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Returns distance in kilometers
}

// Helper function to convert degrees to radians
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate polygon area in square kilometers
export function calculatePolygonArea(coordinates: Array<{ latitude: number; longitude: number }>): number {
  if (coordinates.length < 3) return 0;

  // Convert coordinates to GeoJSON format
  const points = coordinates.map(coord => [coord.longitude, coord.latitude]);
  points.push(points[0]); // Close the polygon

  const polygon = turf.polygon([points]);
  const area = turf.area(polygon);

  return area / 1000000; // Convert to square kilometers
}

// Check if points can form a valid polygon
export function isValidPolygon(coordinates: Array<{ latitude: number; longitude: number }>): boolean {
  if (coordinates.length < 3) return false;

  // Check if points form a non-zero area
  const area = calculatePolygonArea(coordinates);
  return area > 0;
}

// Create a convex hull from points
export function createConvexHull(
  coordinates: Array<{ latitude: number; longitude: number }>,
  tolerance = 0.0001
): Array<{ latitude: number; longitude: number }> | null {
  if (coordinates.length < 3) return null;

  const points = coordinates.map(coord => [coord.longitude, coord.latitude]);
  const hull = turf.convex(turf.points(points));

  if (!hull) return null;

  const simplified = turf.simplify(hull, { tolerance });

  return simplified.geometry.coordinates[0].map(coord => ({
    latitude: coord[1],
    longitude: coord[0],
  }));
}
