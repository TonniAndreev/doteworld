import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { usePaws } from './PawsContext';
import { supabase } from '@/utils/supabase';
import { useWalkHistory } from '@/hooks/useWalkHistory';
import { 
  startWalkSession, 
  addWalkPoint as addWalkPointToSession,
  completeWalkSession,
  cancelWalkSession
} from '@/utils/walkSessionService';
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
  walkSessions: {
    totalWalks: number;
    totalDistance: number;
  };
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
  const [walkSessions, setWalkSessions] = useState({
    totalWalks: 0,
    totalDistance: 0
  });
  const [currentWalkPoints, setCurrentWalkPoints] = useState<Coordinate[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Coordinate[] | null>(null);
  const [currentWalkSessionId, setCurrentWalkSessionId] = useState<string | null>(null);
  const [currentWalkDistance, setCurrentWalkDistance] = useState(0); 
  const [walkStartTime, setWalkStartTime] = useState<Date | null>(null);
  const [walkDuration, setWalkDuration] = useState(0); // in seconds
  
  const { user } = useAuth();
  const { addPaws } = usePaws();
  const { addWalkHistoryEntry } = useWalkHistory();

  useEffect(() => {
    const loadTerritoryData = async () => {
      if (user && user.dogs.length > 0) {
        try {
          const dogId = user.dogs[0].id; // Use first dog for now
          
          // Load territory data from database
          const { data: territoryPoints, error } = await supabase
            .from('territory')
            .select(`
              walk_points (
                latitude,
                longitude
              )
            `)
            .eq('dog_id', dogId);

          if (error) {
            console.error('Error loading territory data:', error);
            return;
          }

          // Convert territory points to polygons and calculate total area
          if (territoryPoints && territoryPoints.length > 0) {
            // This is a simplified approach - in reality you'd need to reconstruct
            // the actual territory polygons from the stored walk points
            const allPoints = territoryPoints.map(tp => tp.walk_points).filter(Boolean);
            
            if (allPoints.length >= 3) {
              const hull = createConvexHull(allPoints);
              if (hull && isValidPolygon(hull)) {
                const polygon = coordinatesToTurfPolygon(hull);
                if (polygon) {
                  setTerritoryGeoJSON(polygon);
                  setTerritorySize(calculatePolygonArea(hull));
                }
              }
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

          if (savedTotalDistance) {
            setTotalDistance(parseFloat(savedTotalDistance));
          }
        } catch (error) {
          console.error('Error loading territory data:', error);
        }
      }
    };

    loadTerritoryData();
  }, [user]);

  const startWalk = async () => {
    setCurrentWalkPoints([]);
    setCurrentPolygon(null);
    setCurrentWalkDistance(0);
    setWalkStartTime(new Date());
    setWalkDuration(0);
    
    if (!user || !user.dogs.length) return;
    
    try {
      // Start a new walk session in the database
      const { sessionId, error } = await startWalkSession(user.dogs[0].id);
      
      if (error || !sessionId) {
        console.error('Failed to start walk session:', error);
        // Fallback to local session ID if database creation fails
        setCurrentWalkSessionId(`walk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      } else {
        setCurrentWalkSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error starting walk:', error);
      // Fallback to local session ID
      setCurrentWalkSessionId(`walk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  };

  // Track walk duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (walkStartTime && currentWalkSessionId) {
      timer = setInterval(() => {
        const now = new Date();
        const durationInSeconds = Math.floor((now.getTime() - walkStartTime.getTime()) / 1000);
        setWalkDuration(durationInSeconds);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [walkStartTime, currentWalkSessionId]);

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

    try {
      // Add walk point to the session
      const { success, error } = await addWalkPointToSession(
        currentWalkSessionId,
        user.dogs[0].id,
        coordinates
      );

      if (!success) {
        console.error('Error adding walk point to session:', error);
      }
    } catch (error) {
      console.error('Error saving walk point:', error);
    }

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
    if (!currentWalkPoints.length || currentWalkPoints.length < 3 || !user || !user.dogs.length || !currentWalkSessionId) {
      console.log('Cannot end walk: insufficient points, no user, or no session');
      return;
    }

    try {
      // Create final polygon from all walk points
      const finalHull = createConvexHull(currentWalkPoints);
      if (!finalHull || !isValidPolygon(finalHull)) {
        console.log('Cannot create valid polygon from walk points');
        setCurrentWalkPoints([]);
        setCurrentPolygon(null);
        setCurrentWalkSessionId(null);
        return;
      }

      // Calculate area of the new polygon before merging
      const newPolygonArea = calculatePolygonArea(finalHull);
      
      // Convert to turf polygon
      const newTurfPolygon = coordinatesToTurfPolygon(finalHull);
      if (!newTurfPolygon) {
        console.log('Failed to convert coordinates to turf polygon');
        return;
      }

      let updatedTerritoryGeoJSON;
      let newTerritorySize;

      if (territoryGeoJSON) {
        // Merge with existing territory
        const mergedPolygon = mergePolygons(territoryGeoJSON, newTurfPolygon);
        if (mergedPolygon) {
          updatedTerritoryGeoJSON = mergedPolygon;
          // Calculate total area of merged territory
          const totalArea = turf.area(mergedPolygon) / 1000000; // Convert to km²
          newTerritorySize = totalArea;
        } else {
          // If merge fails, keep existing territory
          updatedTerritoryGeoJSON = territoryGeoJSON;
          newTerritorySize = territorySize;
        }
      } else {
        // First territory
        updatedTerritoryGeoJSON = newTurfPolygon;
        newTerritorySize = newPolygonArea;
      }

      // Save territory points to database
      try {
        const dogId = user.dogs[0].id;
        
        // Get all walk points from this session
        const { data: walkPoints, error: walkPointsError } = await supabase
          .from('walk_points')
          .select('id')
          .eq('dog_id', dogId)
          .eq('walk_session_id', currentWalkSessionId);

        if (walkPointsError) {
          console.error('Error fetching walk points:', walkPointsError);
        } else if (walkPoints) {
          // Add territory entries for each walk point
          const territoryEntries = walkPoints.map(wp => ({
            walk_point_id: wp.id,
            dog_id: dogId,
          }));

          const { error: territoryError } = await supabase
            .from('territory')
            .insert(territoryEntries);

          if (territoryError) {
            console.error('Error saving territory:', territoryError);
          }
        }
      } catch (error) {
        console.error('Error saving territory to database:', error);
      }

      // Update state
      setTerritoryGeoJSON(updatedTerritoryGeoJSON);
      setTerritorySize(newTerritorySize);
      setCurrentWalkPoints([]);
      setCurrentPolygon(null);
      setCurrentWalkSessionId(null);
      setCurrentWalkDistance(0);

      // Save to storage
      await Promise.all([
        AsyncStorage.setItem(`dote_territory_geojson_${user.uid}`, JSON.stringify(updatedTerritoryGeoJSON)),
        AsyncStorage.setItem(`dote_territory_size_${user.uid}`, newTerritorySize.toString())
      ]);

      // Complete the walk session with final stats
      if (currentWalkSessionId) {
        await completeWalkSession(currentWalkSessionId, {
          distance: currentWalkDistance,
          territoryGained: newPolygonArea
        });
      }

      // Add to walk history
      if (user.dogs[0]) {
        await addWalkHistoryEntry({
          dog_id: user.dogs[0].id,
          start_time: walkStartTime?.toISOString() || new Date().toISOString(),
          end_time: new Date().toISOString(),
          distance: currentWalkDistance,
          duration: walkDuration,
          territory_gained: newPolygonArea,
          points_count: currentWalkPoints.length,
          route_data: {
            points: currentWalkPoints,
            polygon: finalHull,
          }
        });
      }

      // Award paws based on the NEW polygon area only (not total territory)
      const pawsEarned = Math.floor(newPolygonArea * 1000000); // Convert km² to m² for paws
      if (pawsEarned > 0) {
        addPaws(pawsEarned, `Territory conquered: ${(newPolygonArea * 1000000).toFixed(0)} m²`);
      }

      console.log(`Walk completed: ${(newPolygonArea * 1000000).toFixed(0)} m² conquered, ${pawsEarned} paws earned`);
    } catch (error) {
      console.error('Error ending walk:', error);
      // Reset current walk state on error
      setCurrentWalkPoints([]);
      setCurrentPolygon(null);
      
      // Cancel the walk session
      if (currentWalkSessionId && walkStartTime) {
        await cancelWalkSession(currentWalkSessionId);
        
        // Add to walk history as cancelled
        if (user.dogs[0]) {
          await addWalkHistoryEntry({
            dog_id: user.dogs[0].id,
            start_time: walkStartTime.toISOString(),
            end_time: new Date().toISOString(),
            distance: currentWalkDistance,
            duration: walkDuration,
            territory_gained: 0, // No territory gained for cancelled walks
            points_count: currentWalkPoints.length,
            route_data: {
              points: currentWalkPoints,
              status: 'cancelled'
            }
          });
        }
      }
      
      setCurrentWalkSessionId(null);
      setCurrentWalkDistance(0);
      setWalkStartTime(null);
      setWalkDuration(0);
    }
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
    walkSessions,
    territorySize,
    totalDistance,
    currentWalkPoints,
    currentPolygon,
    currentWalkSessionId,
    walkDuration,
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