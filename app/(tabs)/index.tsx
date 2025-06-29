import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Play, Pause, MapPin, Award } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPoints, setWalkPoints] = useState<any[]>([]);
  const [territory, setTerritory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalTerritory: 0,
    currentWalkDistance: 0,
  });

  const mapRef = useRef<MapView>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setIsLoading(false);

      // Load user's territory from database
      if (user) {
        // This would be replaced with actual database call
        const mockTerritory = [
          [
            { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude + 0.001 },
            { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude - 0.001 },
            { latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude - 0.001 },
            { latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude + 0.001 },
          ]
        ];
        setTerritory(mockTerritory);
        setStats({
          totalDistance: 5.2, // km
          totalTerritory: 12500, // m²
          currentWalkDistance: 0,
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    if (isWalking) {
      const interval = setInterval(async () => {
        try {
          const newLocation = await Location.getCurrentPositionAsync({});
          setLocation(newLocation);
          
          // Add point to walk
          const newPoint = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            timestamp: new Date().toISOString(),
          };
          
          setWalkPoints(prev => [...prev, newPoint]);
          
          // Calculate distance
          if (walkPoints.length > 0) {
            const lastPoint = walkPoints[walkPoints.length - 1];
            const distance = calculateDistance(
              lastPoint.latitude,
              lastPoint.longitude,
              newPoint.latitude,
              newPoint.longitude
            );
            
            setStats(prev => ({
              ...prev,
              currentWalkDistance: prev.currentWalkDistance + distance,
            }));
          }
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isWalking, walkPoints]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const startWalk = () => {
    if (!location) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }
    
    setIsWalking(true);
    setWalkPoints([{
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date().toISOString(),
    }]);
    setStats(prev => ({
      ...prev,
      currentWalkDistance: 0,
    }));
  };

  const endWalk = () => {
    setIsWalking(false);
    
    if (walkPoints.length < 3) {
      Alert.alert('Walk too short', 'Your walk was too short to claim territory. Keep walking!');
      setWalkPoints([]);
      return;
    }
    
    // Calculate territory gained
    // In a real app, this would use a proper algorithm to calculate the polygon area
    const territoryGained = Math.floor(stats.currentWalkDistance * 1000 * 2.5); // Simple formula: distance * 2.5
    
    Alert.alert(
      'Walk Completed',
      `Distance: ${stats.currentWalkDistance.toFixed(2)} km\nTerritory gained: ${territoryGained} m²`,
      [
        { text: 'OK', onPress: () => {
          // Update stats
          setStats(prev => ({
            totalDistance: prev.totalDistance + prev.currentWalkDistance,
            totalTerritory: prev.totalTerritory + territoryGained,
            currentWalkDistance: 0,
          }));
          
          // Create a new territory polygon from walk points
          // In a real app, this would use a proper algorithm to create a polygon
          if (walkPoints.length >= 3) {
            setTerritory(prev => [...prev, walkPoints]);
          }
          
          setWalkPoints([]);
        }}
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {location ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation
            followsUserLocation
          >
            {/* User's current walk */}
            {walkPoints.length > 0 && (
              <Polygon
                coordinates={walkPoints}
                fillColor="rgba(255, 107, 53, 0.2)"
                strokeColor={COLORS.primary}
                strokeWidth={2}
              />
            )}
            
            {/* User's territory */}
            {territory.map((polygon, index) => (
              <Polygon
                key={`territory-${index}`}
                coordinates={polygon}
                fillColor="rgba(255, 107, 53, 0.4)"
                strokeColor={COLORS.primary}
                strokeWidth={2}
              />
            ))}
            
            {/* Other users' territories (mock data) */}
            <Polygon
              coordinates={[
                { latitude: location.coords.latitude + 0.003, longitude: location.coords.longitude + 0.003 },
                { latitude: location.coords.latitude + 0.003, longitude: location.coords.longitude + 0.001 },
                { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude + 0.001 },
                { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude + 0.003 },
              ]}
              fillColor="rgba(78, 205, 196, 0.4)"
              strokeColor={COLORS.secondary}
              strokeWidth={2}
            />
            
            {/* Other dog markers */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude + 0.002,
                longitude: location.coords.longitude + 0.002,
              }}
              title="Max"
              description="Golden Retriever"
            >
              <View style={styles.dogMarker}>
                <MapPin size={24} color={COLORS.secondary} />
              </View>
            </Marker>
          </MapView>
          
          {/* Stats overlay */}
          <View style={styles.statsOverlay}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalTerritory} m²</Text>
              <Text style={styles.statLabel}>Territory</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalDistance.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            {isWalking && (
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.currentWalkDistance.toFixed(2)} km</Text>
                <Text style={styles.statLabel}>Current Walk</Text>
              </View>
            )}
          </View>
          
          {/* Walk controls */}
          <View style={styles.walkControls}>
            {isWalking ? (
              <TouchableOpacity style={[styles.walkButton, styles.stopButton]} onPress={endWalk}>
                <Pause size={24} color={COLORS.white} />
                <Text style={styles.walkButtonText}>End Walk</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.walkButton} onPress={startWalk}>
                <Play size={24} color={COLORS.white} />
                <Text style={styles.walkButtonText}>Start Walk</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Achievement notification (mock) */}
          {!isWalking && (
            <View style={styles.achievementContainer}>
              <View style={styles.achievementCard}>
                <Award size={24} color={COLORS.accent} />
                <View style={styles.achievementTextContainer}>
                  <Text style={styles.achievementTitle}>New Achievement!</Text>
                  <Text style={styles.achievementDescription}>Early Bird: Complete a walk before 8 AM</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.gray700,
    marginTop: 10,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    padding: 20,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  statsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.gray600,
  },
  walkControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  walkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  walkButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  dogMarker: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  achievementContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: '90%',
  },
  achievementTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray700,
  },
});