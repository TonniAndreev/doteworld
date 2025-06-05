import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { usePaws } from './PawsContext';

const TerritoryContext = createContext();

export function TerritoryProvider({ children }) {
  const [territory, setTerritory] = useState([]);
  const [territorySize, setTerritorySize] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
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
          } else {
            setTerritory([]);
            await AsyncStorage.setItem(`dote_territory_${user.uid}`, JSON.stringify([]));
          }

          if (savedTerritorySize) {
            setTerritorySize(parseFloat(savedTerritorySize));
          } else {
            setTerritorySize(0);
            await AsyncStorage.setItem(`dote_territory_size_${user.uid}`, '0');
          }

          if (savedTotalDistance) {
            setTotalDistance(parseFloat(savedTotalDistance));
          } else {
            setTotalDistance(0);
            await AsyncStorage.setItem(`dote_total_distance_${user.uid}`, '0');
          }
        } catch (error) {
          console.error('Error loading territory data:', error);
        }
      }
    };

    loadTerritoryData();
  }, [user]);

  const updateTerritory = async (newTerritory) => {
    if (!user) return;
    
    setTerritory(newTerritory);
    
    const newSize = calculateTerritorySize(newTerritory);
    setTerritorySize(newSize);
    
    await Promise.all([
      AsyncStorage.setItem(`dote_territory_${user.uid}`, JSON.stringify(newTerritory)),
      AsyncStorage.setItem(`dote_territory_size_${user.uid}`, newSize.toString()),
    ]);
  };

  const claimNewTerritory = async (coordinates) => {
    if (!user) return;
    
    const isNewTerritory = Math.random() > 0.5;
    
    if (isNewTerritory) {
      const newPolygon = createPolygonAroundPoint(coordinates);
      const updatedTerritory = [...territory, newPolygon];
      const newSize = territorySize + 0.05;
      
      setTerritory(updatedTerritory);
      setTerritorySize(newSize);
      
      await Promise.all([
        AsyncStorage.setItem(`dote_territory_${user.uid}`, JSON.stringify(updatedTerritory)),
        AsyncStorage.setItem(`dote_territory_size_${user.uid}`, newSize.toString()),
      ]);
      
      addPaws(10, 'Claimed new territory');
    }
  };

  const updateTotalDistance = async (newDistance) => {
    if (!user) return;
    
    const updatedDistance = totalDistance + newDistance;
    setTotalDistance(updatedDistance);
    
    await AsyncStorage.setItem(`dote_total_distance_${user.uid}`, updatedDistance.toString());
  };

  const calculateTerritorySize = (territory) => {
    return territory.length * 0.05;
  };

  const createPolygonAroundPoint = (center) => {
    const { latitude, longitude } = center;
    const offset = 0.001;
    
    return [
      { latitude: latitude - offset, longitude: longitude - offset },
      { latitude: latitude - offset, longitude: longitude + offset },
      { latitude: latitude + offset, longitude: longitude + offset },
      { latitude: latitude + offset, longitude: longitude - offset },
      { latitude: latitude - offset, longitude: longitude - offset },
    ];
  };

  const value = {
    territory,
    territorySize,
    totalDistance,
    updateTerritory,
    claimNewTerritory,
    updateTotalDistance,
  };

  return <TerritoryContext.Provider value={value}>{children}</TerritoryContext.Provider>;
}

export const useTerritory = () => useContext(TerritoryContext);