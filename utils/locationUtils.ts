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

// Enhanced merge function with better handling of disjoint territories
export function mergePolygons(
  existing: turf.Feature<turf.Polygon | turf.MultiPolygon>,
  newPolygon: turf.Feature<turf.Polygon>
): turf.Feature<turf.Polygon | turf.MultiPolygon> | null {
  try {
    console.log('Attempting to merge polygons...');
    
    // Perform union operation
    const unionResult = turf.union(existing, newPolygon);
    
    if (!unionResult) {
      console.warn('Union operation returned null, keeping existing territory');
      return existing;
    }

    console.log('Union result type:', unionResult.geometry.type);

    // If the result is a MultiPolygon, try to dissolve contiguous polygons
    if (unionResult.geometry.type === 'MultiPolygon') {
      try {
        console.log('Result is MultiPolygon, attempting to dissolve contiguous polygons...');
        
        // Flatten the MultiPolygon into individual Polygon features
        const flattened = turf.flatten(unionResult);
        
        // Try to dissolve the polygons (merge contiguous ones)
        const dissolved = turf.dissolve(flattened);
        
        if (dissolved && dissolved.features.length > 0) {
          // If dissolve resulted in a single feature, return it
          if (dissolved.features.length === 1) {
            console.log('Dissolved into single polygon');
            return dissolved.features[0] as turf.Feature<turf.Polygon | turf.MultiPolygon>;
          } else {
            // Multiple features remain - create a MultiPolygon from them
            console.log('Dissolved into', dissolved.features.length, 'separate polygons');
            const multiPolygonCoords = dissolved.features.map(feature => {
              if (feature.geometry.type === 'Polygon') {
                return feature.geometry.coordinates;
              } else if (feature.geometry.type === 'MultiPolygon') {
                return feature.geometry.coordinates[0]; // Take first polygon from MultiPolygon
              }
              return [];
            }).filter(coords => coords.length > 0);
            
            return turf.multiPolygon(multiPolygonCoords);
          }
        } else {
          console.log('Dissolve failed, returning original union result');
          return unionResult;
        }
      } catch (dissolveError) {
        console.warn('Dissolve operation failed:', dissolveError);
        // Return the union result even if dissolve fails
        return unionResult;
      }
    }

    // If it's already a single Polygon, return as-is
    console.log('Union result is single polygon');
    return unionResult;
    
  } catch (error) {
    console.error('Error in mergePolygons:', error);
    // If all else fails, return the existing polygon to maintain app stability
    return existing;
  }
}