import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { usePaws } from './PawsContext';
import { 
  calculatePolygonArea, 
  isValidPolygon, 
  createConvexHull,
  coordinatesToTurfPolygon,
  mergePolygons,
  extractPolygonCoordinates,
  doPolygonsOverlap
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
  
  const { user } = useAuth();
  const { addPaws } = usePaws();

  useEffect(() => {
    const loadTerritoryData = async () => {
      if (user) {
        try {
          const [savedTerritoryGeoJSON, savedTerritorySize, savedTotalDistance] = await Promise.all([
            AsyncStorage.getItem(`dote_territory_geojson_${user.uid || user.id}`),
            AsyncStorage.getItem(`dote_territory_size_${user.uid || user.id}`),
            AsyncStorage.getItem(`dote_total_distance_${user.uid || user.id}`),
          ]);

          if (savedTerritoryGeoJSON) {
            const parsedGeoJSON = JSON.parse(savedTerritoryGeoJSON);
            setTerritoryGeoJSON(parsedGeoJSON);
          }

          if (savedTerritorySize) {
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

  const startWalk = () => {
    setCurrentWalkPoints([]);
    setCurrentPolygon(null);
  };

  const addWalkPoint = (coordinates: Coordinate) => {
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
    if (!currentWalkPoints.length || currentWalkPoints.length < 3 || !user) {
      console.log('Cannot end walk: insufficient points or no user');
      return;
    }

    try {
      // Create final polygon from all walk points
      const finalHull = createConvexHull(currentWalkPoints);
      if (!finalHull || !isValidPolygon(finalHull)) {
        console.log('Cannot create valid polygon from walk points');
        setCurrentWalkPoints([]);
        setCurrentPolygon(null);
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
        // Check if the new polygon overlaps with existing territory
        const hasOverlap = doPolygonsOverlap(territoryGeoJSON, newTurfPolygon);
        
        if (hasOverlap) {
          // Merge with existing territory if there's overlap
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
          // No overlap - create a MultiPolygon to keep territories separate
          const existingCoords = territoryGeoJSON.geometry.type === 'Polygon' 
            ? [territoryGeoJSON.geometry.coordinates]
            : territoryGeoJSON.geometry.coordinates;
          
          const newCoords = [...existingCoords, newTurfPolygon.geometry.coordinates];
          
          updatedTerritoryGeoJSON = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'MultiPolygon',
              coordinates: newCoords
            }
          } as turf.Feature<turf.MultiPolygon>;
          
          // Calculate total area of all territories
          const totalArea = turf.area(updatedTerritoryGeoJSON) / 1000000; // Convert to km²
          newTerritorySize = totalArea;
        }
      } else {
        // First territory
        updatedTerritoryGeoJSON = newTurfPolygon;
        newTerritorySize = newPolygonArea;
      }

      // Update state
      setTerritoryGeoJSON(updatedTerritoryGeoJSON);
      setTerritorySize(newTerritorySize);
      setCurrentWalkPoints([]);
      setCurrentPolygon(null);

      // Save to storage
      const userId = user.uid || user.id;
      await Promise.all([
        AsyncStorage.setItem(`dote_territory_geojson_${userId}`, JSON.stringify(updatedTerritoryGeoJSON)),
        AsyncStorage.setItem(`dote_territory_size_${userId}`, newTerritorySize.toString()),
      ]);

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
    }
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