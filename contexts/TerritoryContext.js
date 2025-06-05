import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { usePaws } from './PawsContext';
import { calculatePolygonArea, isValidPolygon, createConvexHull } from '@/utils/locationUtils';

const TerritoryContext = createContext();

export function TerritoryProvider({ children }) {
  const [territory, setTerritory] = useState([]);
  const [territorySize, setTerritorySize] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentWalkPoints, setCurrentWalkPoints] = useState([]);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  
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

  const addWalkPoint = (coordinates) => {
    const newPoints = [...currentWalkPoints, coordinates];
    setCurrentWalkPoints(newPoints);

    // Only try to form a polygon if we have at least 3 points
    if (newPoints.length >= 3) {
      const hull = createConvexHull(newPoints);
      if (isValidPolygon(hull)) {
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

  const value = {
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

export const useTerritory = () => useContext(TerritoryContext);