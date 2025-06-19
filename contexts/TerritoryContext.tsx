import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { usePaws } from './PawsContext';
import { calculatePolygonArea, isValidPolygon, createConvexHull } from '@/utils/locationUtils';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface TerritoryContextType {
  territory: Coordinate[][];
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
  const [territory, setTerritory] = useState<Coordinate[][]>([]);
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
          const [savedTerritory, savedTerritorySize, savedTotalDistance] = await Promise.all([
            AsyncStorage.getItem(`dote_territory_${user.uid}`),
            AsyncStorage.getItem(`dote_territory_size_${user.uid}`),
            AsyncStorage.getItem(`dote_total_distance_${user.uid}`),
          ]);

          if (savedTerritory) {
            setTerritory(JSON.parse(savedTerritory));
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
      }
    }
  };

  const endWalk = async () => {
    if (!currentPolygon || !user) return;

    const newPolygonArea = calculatePolygonArea(currentPolygon);
    const updatedTerritory = [...territory, currentPolygon];
    const newTerritorySize = territorySize + newPolygonArea;

    setTerritory(updatedTerritory);
    setTerritorySize(newTerritorySize);
    setCurrentWalkPoints([]);
    setCurrentPolygon(null);

    await Promise.all([
      AsyncStorage.setItem(`dote_territory_${user.uid}`, JSON.stringify(updatedTerritory)),
      AsyncStorage.setItem(`dote_territory_size_${user.uid}`, newTerritorySize.toString()),
    ]);

    // Award paws based on the new territory size (1 paw per square meter)
    const pawsEarned = Math.floor(newPolygonArea * 1000);
    if (pawsEarned > 0) {
      addPaws(pawsEarned, 'Territory conquered');
    }
  };

  const value: TerritoryContextType = {
    territory,
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