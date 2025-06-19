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

// Calculate polygon area in square kilometers using turf.js
export function calculatePolygonArea(coordinates: Array<{ latitude: number; longitude: number }>): number {
  if (coordinates.length < 3) return 0;

  try {
    // Convert coordinates to GeoJSON format
    const points = coordinates.map(coord => [coord.longitude, coord.latitude]);
    points.push(points[0]); // Close the polygon

    const polygon = turf.polygon([points]);
    const area = turf.area(polygon);

    return area / 1000000; // Convert to square kilometers
  } catch (error) {
    console.error('Error calculating polygon area:', error);
    return 0;
  }
}

// Check if points can form a valid polygon
export function isValidPolygon(coordinates: Array<{ latitude: number; longitude: number }>): boolean {
  if (coordinates.length < 3) return false;

  try {
    // Check if points form a non-zero area
    const area = calculatePolygonArea(coordinates);
    return area > 0.000001; // Minimum area threshold (1 square meter)
  } catch (error) {
    console.error('Error validating polygon:', error);
    return false;
  }
}

// Create a convex hull from points using turf.js
export function createConvexHull(
  coordinates: Array<{ latitude: number; longitude: number }>
): Array<{ latitude: number; longitude: number }> | null {
  if (coordinates.length < 3) return null;

  try {
    const points = coordinates.map(coord => [coord.longitude, coord.latitude]);
    const pointCollection = turf.points(points);
    const hull = turf.convex(pointCollection);

    if (!hull || !hull.geometry) return null;

    // Extract coordinates and convert back to lat/lng format
    const hullCoords = hull.geometry.coordinates[0];
    return hullCoords.slice(0, -1).map(coord => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
  } catch (error) {
    console.error('Error creating convex hull:', error);
    return null;
  }
}

// Extract polygon coordinates from GeoJSON for react-native-maps rendering
export function extractPolygonCoordinates(
  territoryGeoJSON: turf.Feature<turf.Polygon | turf.MultiPolygon> | null
): Array<Array<{ latitude: number; longitude: number }>> {
  if (!territoryGeoJSON || !territoryGeoJSON.geometry) return [];

  try {
    const { geometry } = territoryGeoJSON;
    
    if (geometry.type === 'Polygon') {
      // Single polygon
      const coords = geometry.coordinates[0]; // Exterior ring only
      return [coords.map(coord => ({
        latitude: coord[1],
        longitude: coord[0],
      }))];
    } else if (geometry.type === 'MultiPolygon') {
      // Multiple polygons
      return geometry.coordinates.map(polygon => {
        const coords = polygon[0]; // Exterior ring only
        return coords.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
      });
    }
  } catch (error) {
    console.error('Error extracting polygon coordinates:', error);
  }

  return [];
}

// Convert coordinates to turf polygon
export function coordinatesToTurfPolygon(
  coordinates: Array<{ latitude: number; longitude: number }>
): turf.Feature<turf.Polygon> | null {
  if (coordinates.length < 3) return null;

  try {
    const points = coordinates.map(coord => [coord.longitude, coord.latitude]);
    points.push(points[0]); // Close the polygon
    return turf.polygon([points]);
  } catch (error) {
    console.error('Error converting coordinates to turf polygon:', error);
    return null;
  }
}

// Merge two GeoJSON features using turf union
export function mergePolygons(
  existing: turf.Feature<turf.Polygon | turf.MultiPolygon>,
  newPolygon: turf.Feature<turf.Polygon>
): turf.Feature<turf.Polygon | turf.MultiPolygon> | null {
  try {
    const union = turf.union(existing, newPolygon);
    return union;
  } catch (error) {
    console.error('Error merging polygons:', error);
    // If union fails, return the existing polygon
    return existing;
  }
}

// Check if two polygons overlap
export function doPolygonsOverlap(
  polygon1: turf.Feature<turf.Polygon | turf.MultiPolygon>,
  polygon2: turf.Feature<turf.Polygon>
): boolean {
  try {
    const intersection = turf.intersect(polygon1, polygon2);
    return intersection !== null;
  } catch (error) {
    console.error('Error checking polygon overlap:', error);
    return false;
  }
}