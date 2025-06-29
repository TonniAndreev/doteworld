import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { usePaws } from './PawsContext';
import { supabase } from '@/utils/supabase';
import { 
  calculatePolygonArea, 
  isValidPolygon, 
  createConvexHull,
  coordinatesToTurfPolygon,
  mergePolygons,
  extractPolygonCoordinates
} from '@/utils/locationUtils';
import * as turf from '@turf/turf';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface TerritoryContextType {
  territory: Coordinate[][];
  territoryGeoJSON: turf.Feature<turf.Polygon | turf.MultiPolygon> | null;
  territorySize: number;
  totalDistance: number;
  currentWalkPoints: Coordinate[];
  currentPolygon: Coordinate[] | null;
  currentWalkSessionId: string | null;
  currentWalkDistance: number;
  startWalk: () => void;
  addWalkPoint: (coordinates: Coordinate) => void;
  endWalk: () => Promise<void>;
}

const TerritoryContext = createContext<TerritoryContextType | undefined>(undefined);

export function TerritoryProvider({ children }: { children: ReactNode }) {
  const [territoryGeoJSON, setTerritoryGeoJSON] = useState<turf.Feature<turf.Polygon | turf.MultiPolygon> | null>(null);
  const [territorySize, setTerritorySize] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentWalkPoints, setCurrentWalkPoints] = useState<Coordinate[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Coordinate[] | null>(null);
  const [currentWalkSessionId, setCurrentWalkSessionId] = useState<string | null>(null);
  const [currentWalkDistance, setCurrentWalkDistance] = useState(0);
  
  const { user } = useAuth();
  const { addPaws } = usePaws();

  useEffect(() => {
    const loadTerritoryData = async () => {
      if (user && user.dogs.length > 0) {
        try {
          const dogId = user.dogs[0].id; // Use first dog for now
          
          // Load territory data from database
          const { data: walkSessions, error } = await supabase
            .from('walk_sessions')
            .select(`
              id,
              territory_gained,
              distance,
              walk_points (
                id,
                path_coordinates
              )
            `)
            .eq('dog_id', dogId)
            .eq('status', 'completed');

          if (error) {
            console.error('Error loading territory data:', error);
            return;
          }

          // Process walk sessions to reconstruct territory
          if (walkSessions && walkSessions.length > 0) {
            console.log(`Found ${walkSessions.length} walk sessions`);
            
            let totalTerritory = 0;
            let totalWalkDistance = 0;
            let allPolygons: turf.Feature<turf.Polygon>[] = [];
            
            for (const session of walkSessions) {
              // Add to total territory and distance
              totalTerritory += session.territory_gained || 0;
              totalWalkDistance += session.distance || 0;
              
              // Process walk points to create polygons
              if (session.walk_points && session.walk_points.length > 0) {
                for (const point of session.walk_points) {
                  if (point.path_coordinates && point.path_coordinates.length >= 3) {
                    // Convert JSON coordinates to Coordinate[] format
                    const coordinates = point.path_coordinates as Coordinate[];
                    
                    // Create polygon from coordinates
                    const polygon = coordinatesToTurfPolygon(coordinates);
                    if (polygon) {
                      allPolygons.push(polygon);
                    }
                  }
                }
              }
            }
            
            // Merge all polygons into one territory
            if (allPolygons.length > 0) {
              let mergedTerritory = allPolygons[0];
              
              for (let i = 1; i < allPolygons.length; i++) {
                const merged = mergePolygons(mergedTerritory, allPolygons[i]);
                if (merged) {
                  mergedTerritory = merged;
                }
              }
              
              setTerritoryGeoJSON(mergedTerritory);
              setTerritorySize(totalTerritory);
              setTotalDistance(totalWalkDistance);
            }
          }

          // Load from local storage as fallback
          const [savedTerritoryGeoJSON, savedTerritorySize, savedTotalDistance] = await Promise.all([
            AsyncStorage.getItem(`dote_territory_geojson_${user.uid}`),
            AsyncStorage.getItem(`dote_territory_size_${user.uid}`),
            AsyncStorage.getItem(`dote_total_distance_${user.uid}`),
          ]);

          if (savedTerritoryGeoJSON && !territoryGeoJSON) {
            const parsedGeoJSON = JSON.parse(savedTerritoryGeoJSON);
            setTerritoryGeoJSON(parsedGeoJSON);
          }

          if (savedTerritorySize && territorySize === 0) {
            setTerritorySize(parseFloat(savedTerritorySize));
          }

          if (savedTotalDistance && totalDistance === 0) {
            setTotalDistance(parseFloat(savedTotalDistance));
          }
        } catch (error) {
          console.error('Error loading territory data:', error);
        }
      }
    };

    loadTerritoryData();
  }, [user]);

  const startWalk = () => {
    setCurrentWalkPoints([]);
    setCurrentPolygon(null);
    setCurrentWalkDistance(0);
    // Generate a unique session ID for this walk
    setCurrentWalkSessionId(`walk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  };

  const addWalkPoint = async (coordinates: Coordinate) => {
    if (!user || !user.dogs.length || !currentWalkSessionId) return;

    // Calculate distance from previous point
    if (currentWalkPoints.length > 0) {
      const lastPoint = currentWalkPoints[currentWalkPoints.length - 1];
      const distance = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        coordinates.latitude,
        coordinates.longitude
      );
      setCurrentWalkDistance(prev => prev + distance);
    }

    const newPoints = [...currentWalkPoints, coordinates];
    setCurrentWalkPoints(newPoints);

    // Only try to form a polygon if we have at least 3 points
    if (newPoints.length >= 3) {
      const hull = createConvexHull(newPoints);
      if (hull && isValidPolygon(hull)) {
        setCurrentPolygon(hull);
      } else {
        setCurrentPolygon(null);
      }
    } else {
      setCurrentPolygon(null);
    }
  };

  const endWalk = async () => {
    console.log('=== STARTING ENDWALK FUNCTION ===');
    console.log('Current walk points:', currentWalkPoints.length);
    console.log('Current walk distance:', currentWalkDistance);
    console.log('User:', user?.id);
    console.log('Dog ID:', user?.dogs[0]?.id);
    console.log('Session ID:', currentWalkSessionId);
    
    if (!currentWalkPoints.length || currentWalkPoints.length < 3 || !user || !user.dogs.length || !currentWalkSessionId) {
      console.log('Cannot end walk: insufficient points, no user, or no session');
      return;
    }

    try {
      console.log('Creating final polygon from walk points');
      // Create final polygon from all walk points
      const finalHull = createConvexHull(currentWalkPoints);
      if (!finalHull || !isValidPolygon(finalHull)) {
        console.log('Cannot create valid polygon from walk points');
        setCurrentWalkPoints([]);
        setCurrentPolygon(null);
        setCurrentWalkSessionId(null);
        return;
      }

      console.log('Calculating area of new polygon');
      // Calculate area of the new polygon before merging
      const newPolygonArea = calculatePolygonArea(finalHull);
      console.log('New polygon area:', newPolygonArea, 'km²');
      
      console.log('Converting to turf polygon');
      // Convert to turf polygon
      const newTurfPolygon = coordinatesToTurfPolygon(finalHull);
      if (!newTurfPolygon) {
        console.log('Failed to convert coordinates to turf polygon');
        return;
      }

      let updatedTerritoryGeoJSON;
      let newTerritorySize;

      if (territoryGeoJSON) {
        console.log('Merging with existing territory');
        // Merge with existing territory
        const mergedPolygon = mergePolygons(territoryGeoJSON, newTurfPolygon);
        if (mergedPolygon) {
          updatedTerritoryGeoJSON = mergedPolygon;
          // Calculate total area of merged territory
          const totalArea = turf.area(mergedPolygon) / 1000000; // Convert to km²
          newTerritorySize = totalArea;
          console.log('Merged territory size:', newTerritorySize, 'km²');
        } else {
          // If merge fails, keep existing territory
          updatedTerritoryGeoJSON = territoryGeoJSON;
          newTerritorySize = territorySize;
          console.log('Merge failed, keeping existing territory size:', newTerritorySize, 'km²');
        }
      } else {
        console.log('First territory for user');
        // First territory
        updatedTerritoryGeoJSON = newTurfPolygon;
        newTerritorySize = newPolygonArea;
      }

      console.log('Preparing walk session data for database');
      console.log('Dog ID:', user.dogs[0].id);
      console.log('Distance:', currentWalkDistance);
      console.log('Points count:', currentWalkPoints.length);
      console.log('Territory gained:', newPolygonArea);
      
      // Create a walk session record
      console.log('Inserting walk session into database...');
      const { data: walkSession, error: sessionError } = await supabase
        .from('walk_sessions')
        .insert({
          dog_id: user.dogs[0].id,
          started_at: new Date(Date.now() - (currentWalkDistance * 60000)).toISOString(), // Approximate start time
          ended_at: new Date().toISOString(),
          distance: currentWalkDistance,
          points_count: currentWalkPoints.length,
          territory_gained: newPolygonArea,
          status: 'completed',
          weather_conditions: null // Could add weather data in the future
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('Error creating walk session:', sessionError);
        console.log('Session error details:', sessionError.details);
        console.log('Session error hint:', sessionError.hint);
        console.log('Session error message:', sessionError.message);
        throw sessionError;
      }

      console.log('Created walk session with ID:', walkSession.id);

      // Save walk points with path_coordinates
      console.log('Preparing walk points data');
      console.log('Walk session ID:', walkSession.id);
      console.log('Dog ID:', user.dogs[0].id);
      console.log('First point:', currentWalkPoints[0]);
      console.log('Path coordinates length:', currentWalkPoints.length);
      
      console.log('Inserting walk points into database...');
      const { data: pointsData, error: pointsError } = await supabase
        .from('walk_points')
        .insert({
          dog_id: user.dogs[0].id,
          walk_session_id: walkSession.id,
          path_coordinates: currentWalkPoints,
          // Remove latitude and longitude fields as they don't exist in the schema
          timestamp: new Date().toISOString()
        })
        .select('id');

      if (pointsError) {
        console.error('Error saving walk points:', pointsError);
        console.log('Points error details:', pointsError.details);
        console.log('Points error hint:', pointsError.hint);
        console.log('Points error message:', pointsError.message);
        throw pointsError;
      }

      console.log('Walk points saved successfully:', pointsData);

      // Update state
      console.log('Updating local state');
      setTerritoryGeoJSON(updatedTerritoryGeoJSON);
      setTerritorySize(newTerritorySize);
      setTotalDistance(prev => prev + currentWalkDistance);
      setCurrentWalkPoints([]);
      setCurrentPolygon(null);
      setCurrentWalkSessionId(null);
      setCurrentWalkDistance(0);

      // Save to storage
      console.log('Saving to AsyncStorage');
      await Promise.all([
        AsyncStorage.setItem(`dote_territory_geojson_${user.uid}`, JSON.stringify(updatedTerritoryGeoJSON)),
        AsyncStorage.setItem(`dote_territory_size_${user.uid}`, newTerritorySize.toString()),
        AsyncStorage.setItem(`dote_total_distance_${user.uid}`, (totalDistance + currentWalkDistance).toString()),
      ]);

      // Award paws based on the NEW polygon area only (not total territory)
      const pawsEarned = Math.floor(newPolygonArea * 1000000); // Convert km² to m² for paws
      if (pawsEarned > 0) {
        console.log('Awarding paws:', pawsEarned);
        addPaws(pawsEarned, `Territory conquered: ${(newPolygonArea * 1000000).toFixed(0)} m²`);
      }

      console.log(`Walk completed: ${(newPolygonArea * 1000000).toFixed(0)} m² conquered, ${pawsEarned} paws earned`);
    } catch (error) {
      console.error('Error ending walk:', error);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      
      // Reset current walk state on error
      setCurrentWalkPoints([]);
      setCurrentPolygon(null);
      setCurrentWalkSessionId(null);
      setCurrentWalkDistance(0);
    }
    
    console.log('=== ENDWALK FUNCTION COMPLETED ===');
  };

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Extract renderable polygons for the map
  const renderablePolygons = extractPolygonCoordinates(territoryGeoJSON);

  const value: TerritoryContextType = {
    territory: renderablePolygons, // For backward compatibility with existing map rendering
    territoryGeoJSON,
    territorySize,
    totalDistance,
    currentWalkPoints,
    currentPolygon,
    currentWalkSessionId,
    currentWalkDistance,
    startWalk,
    addWalkPoint,
    endWalk,
  };

  return <TerritoryContext.Provider value={value}>{children}</TerritoryContext.Provider>;
}

export const useTerritory = () => {
  const context = useContext(TerritoryContext);
  if (!context) throw new Error("useTerritory must be used inside TerritoryProvider");
  return context;
};