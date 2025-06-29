import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Play, Pause, Locate } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, Marker, Polyline, Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { COLORS } from '@/constants/theme';
import { useTerritory } from '@/contexts/TerritoryContext';
import { usePaws } from '@/contexts/PawsContext';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import FloatingPawsBalance from '@/components/common/FloatingPawsBalance';
import PawsModal from '@/components/home/PawsModal';
import MonthlyResetDialog from '@/components/home/MonthlyResetDialog';
import CityChangeDialog from '@/components/common/CityChangeDialog';
import DogMarker from '@/components/map/DogMarker';
import { calculateDistance } from '@/utils/locationUtils';
import { USER_TERRITORY_COLOR, getColorWithOpacity } from '@/utils/mapColors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { reverseGeocodeToCity, getOrCreateCityInSupabase } from '@/utils/geocoding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConquestSummaryDialog from '@/components/home/ConquestSummaryDialog';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkDistance, setWalkDistance] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [showPawsModal, setShowPawsModal] = useState(false);
  const [showCityChangeDialog, setShowCityChangeDialog] = useState(false);
  const [detectedCity, setDetectedCity] = useState<{id: string, name: string} | null>(null);
  const [isProcessingCityChange, setIsProcessingCityChange] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [lastGeocodeAttemptDate, setLastGeocodeAttemptDate] = useState<string | null>(null);
  const [showConquestSummary, setShowConquestSummary] = useState(false);
  const [conquestSummaryData, setConquestSummaryData] = useState<{
    territoryGained: number;
    distanceWalked: number;
    localRanking: number | null;
  } | null>(null);
  
  const mapRef = useRef<MapView>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);
  
  const { 
    territory,
    territorySize,
    currentWalkPoints,
    currentPolygon,
    currentWalkDistance,
    showMonthlyResetDialog,
    closeMonthlyResetDialog,
    startWalk,
    addWalkPoint,
    endWalk,
  } = useTerritory();
  
  const { canStartConquest, startConquest, isSubscribed } = usePaws();
  const { friends, isLoading: isFriendsLoading } = useFriends();
  const { user, updateUserCity } = useAuth();

  // Initial location setup
  useEffect(() => {
    const setupInitialLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(initialLocation);
        lastLocationRef.current = initialLocation;
        
        // Check city based on location
        await checkCityFromLocation(initialLocation.coords.latitude, initialLocation.coords.longitude);
      } catch (error) {
        console.error('Error getting initial location:', error);
        setErrorMsg('Failed to get your location');
      }
    };

    setupInitialLocation();
  }, []);

  // Load last geocode attempt date from AsyncStorage
  useEffect(() => {
    const loadLastGeocodeDate = async () => {
      try {
        const storedDate = await AsyncStorage.getItem('lastGeocodeAttemptDate');
        if (storedDate) {
          setLastGeocodeAttemptDate(storedDate);
          console.log('Last geocode attempt date:', storedDate);
        }
      } catch (error) {
        console.error('Error loading last geocode date:', error);
      }
    };
    
    loadLastGeocodeDate();
  }, []);

  // Check city from location coordinates
  const checkCityFromLocation = async (latitude: number, longitude: number) => {
    try {
      // Skip if user is not logged in
      if (!user) return;
      
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already attempted geocoding today
      if (lastGeocodeAttemptDate === today) {
        console.log('Already attempted geocoding today, skipping');
        return;
      }
      
      // Update the last attempt date regardless of success
      setLastGeocodeAttemptDate(today);
      await AsyncStorage.setItem('lastGeocodeAttemptDate', today);
      
      // Get city details from coordinates
      const cityDetails = await reverseGeocodeToCity(latitude, longitude);
      if (!cityDetails) {
        console.log('Could not determine city from coordinates');
        return;
      }
      
      console.log('Detected city:', cityDetails.name, cityDetails.country);
      
      // Get or create city in database
      const cityId = await getOrCreateCityInSupabase(cityDetails);
      if (!cityId) {
        console.log('Failed to get or create city in database');
        return;
      }
      
      // If user doesn't have a current city, set it automatically
      if (!user.current_city_id) {
        console.log('User has no current city, setting automatically');
        await updateUserCity(cityId, cityDetails.name);
        return;
      }
      
      // If user's current city is different from detected city, show dialog
      if (user.current_city_id !== cityId) {
        console.log('Detected city change:', user.current_city_name, '->', cityDetails.name);
        setDetectedCity({
          id: cityId,
          name: cityDetails.name
        });
        setShowCityChangeDialog(true);
      }
    } catch (error) {
      console.error('Error checking city from location:', error);
    }
  };

  // Handle city change confirmation
  const handleConfirmCityChange = async () => {
    if (!detectedCity) return;
    
    setIsProcessingCityChange(true);
    try {
      const success = await updateUserCity(detectedCity.id, detectedCity.name);
      if (success) {
        console.log('Successfully updated user city to:', detectedCity.name);
      } else {
        console.error('Failed to update user city');
      }
    } catch (error) {
      console.error('Error updating user city:', error);
    } finally {
      setIsProcessingCityChange(false);
      setShowCityChangeDialog(false);
    }
  };

  // Location tracking during walking
  useEffect(() => {
    const startLocationTracking = async () => {
      if (!isWalking) {
        // Stop tracking when not walking
        if (locationSubscriptionRef.current) {
          locationSubscriptionRef.current.remove();
          locationSubscriptionRef.current = null;
        }
        return;
      }

      try {
        console.log('Starting location tracking for conquest...');
        
        // Start location subscription for walking
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5, // Update every 5 meters
            timeInterval: 3000, // Update every 3 seconds minimum
          },
          (newLocation) => {
            console.log('New location received:', newLocation.coords.latitude, newLocation.coords.longitude);
            setLocation(newLocation);

            if (lastLocationRef.current) {
              const distance = calculateDistance(
                lastLocationRef.current.coords.latitude,
                lastLocationRef.current.coords.longitude,
                newLocation.coords.latitude,
                newLocation.coords.longitude
              );

              console.log('Distance moved:', distance * 1000, 'meters');

              // Only add point if we've moved at least 5 meters to avoid duplicate points
              if (distance >= 0.005) { // 5 meters in km
                console.log('Adding new walk point');
                setWalkDistance(prev => prev + distance);
                addWalkPoint({
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude
                });
                lastLocationRef.current = newLocation;
              }
            } else {
              // First point during walk
              console.log('Adding first walk point');
              addWalkPoint({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude
              });
              lastLocationRef.current = newLocation;
            }
          }
        );
      } catch (error) {
        console.error('Error setting up location tracking:', error);
        setErrorMsg('Failed to start location tracking');
      }
    };

    startLocationTracking();

    // Cleanup function
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, [isWalking, addWalkPoint]);
  
  const toggleWalking = async () => {
    if (!isWalking) {
      // Check if user can start conquest
      if (!canStartConquest) {
        setShowPawsModal(true);
        return;
      }

      // Attempt to start conquest (consumes paw if not subscribed)
      const success = await startConquest();
      if (!success) {
        setShowPawsModal(true);
        return;
      }

      console.log('Starting conquest...');
      setWalkDistance(0);
      setIsWalking(true);
      
      // Start walk with current city ID if available
      startWalk(user?.current_city_id || undefined);
      
      // Add initial point if we have a location
      if (location) {
        console.log('Adding initial walk point');
        addWalkPoint({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        lastLocationRef.current = location;
      }
    } else {
      console.log('Ending conquest...');
      setIsWalking(false);
      
      // Stop location tracking
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      
      const summary = await endWalk();
      if (summary) {
        setConquestSummaryData(summary);
        setShowConquestSummary(true);
      }
    }
  };

  const handleLocateMe = async () => {
    if (!mapRef.current || !location) return;
    
    setIsLocating(true);
    try {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } catch (error) {
      console.error('Error animating to location:', error);
    } finally {
      setIsLocating(false);
    }
  };

  const getButtonText = () => {
    if (isWalking) return 'Finish Conquest';
    if (!canStartConquest && !isSubscribed) return 'Need Paws to Conquer';
    return 'Conquer Territory';
  };

  const getButtonStyle = () => {
    if (isWalking) return [styles.startWalkButton, styles.activeButton];
    if (!canStartConquest && !isSubscribed) return [styles.startWalkButton, styles.disabledButton];
    return styles.startWalkButton;
  };

  const handleDogMarkerPress = (dogId: string, dogName: string) => {
    console.log(`Dog marker pressed: ${dogName} (${dogId})`);
    // You could navigate to dog profile or show more info
  };

  // Calculate the appropriate radius in meters based on the current zoom level
  const calculatePixelRadiusInMeters = (pixelRadius: number = 2): number => {
    if (!mapRegion) return 3; // Default radius in meters if no region available
    
    // Calculate meters per pixel at the current latitude
    const { latitudeDelta, longitudeDelta } = mapRegion;
    const metersPerPixelLat = (latitudeDelta * 111320) / screenHeight;
    
    // Convert desired pixel radius to meters
    return pixelRadius * metersPerPixelLat;
  };

  // Handle map region change to update the zoom level state
  const handleRegionChange = (region: Region) => {
    setMapRegion(region);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
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
            followsUserLocation={!isWalking} // Don't follow when walking to see the path
            zoomEnabled={true}
            rotateEnabled={true}
            scrollEnabled={true}
            onRegionChangeComplete={handleRegionChange}
          >
            {/* Render user's conquered territories */}
            {territory.map((polygon, index) => (
              <Polygon
                key={`territory-${index}`}
                coordinates={polygon}
                fillColor={getColorWithOpacity(USER_TERRITORY_COLOR, 0.3)}
                strokeColor={USER_TERRITORY_COLOR}
                strokeWidth={2}
              />
            ))}
            
            {/* Render friends' territories */}
            {!isFriendsLoading && friends.map(friend => 
              friend.territoryPolygons?.map(territory => (
                <Polygon
                  key={`friend-territory-${friend.id}-${territory.id}`}
                  coordinates={territory.coordinates}
                  fillColor={getColorWithOpacity(territory.color, 0.3)}
                  strokeColor={territory.color}
                  strokeWidth={2}
                />
              ))
            )}
            
            {/* Render current walk points as orange circles with dynamic radius */}
            {currentWalkPoints.map((point, index) => (
              <Circle
                key={`walk-point-${index}`}
                center={point}
                radius={calculatePixelRadiusInMeters(2)} // Dynamic radius based on zoom
                fillColor={COLORS.primary}
                strokeColor={COLORS.white}
                strokeWidth={1}
              />
            ))}
            
            {/* Render current walk path as dashed line */}
            {currentWalkPoints.length > 1 && (
              <Polyline
                coordinates={currentWalkPoints}
                strokeColor={COLORS.primary}
                strokeWidth={3}
                lineDashPattern={[10, 5]} // Dashed line pattern
              />
            )}
            
            {/* Render current polygon preview with dashed border and more transparent fill */}
            {currentPolygon && (
              <Polygon
                coordinates={currentPolygon}
                fillColor={getColorWithOpacity(USER_TERRITORY_COLOR, 0.15)}
                strokeColor={USER_TERRITORY_COLOR}
                strokeWidth={2}
                lineDashPattern={[5, 5]}
              />
            )}
            
            {/* Render dog markers at the center of each friend's territory */}
            {!isFriendsLoading && friends.map(friend => 
              friend.territoryPolygons?.map(territory => 
                territory.centroid && (
                  <DogMarker
                    key={`dog-marker-${friend.id}-${territory.dogId}-${territory.id}`}
                    coordinate={territory.centroid}
                    dogId={territory.dogId}
                    dogName={territory.dogName}
                    dogPhotoURL={territory.dogPhotoURL}
                    dogBreed={territory.dogBreed}
                    color={territory.color}
                    onPress={() => handleDogMarkerPress(territory.dogId, territory.dogName)}
                  />
                )
              )
            )}
          </MapView>

          <SafeAreaView style={styles.overlay} pointerEvents="box-none">
            <View style={styles.topBar}>
              <FloatingPawsBalance />
              
              {user?.current_city_name && (
                <View style={styles.cityContainer}>
                  <MapPin size={16} color={COLORS.primary} />
                  <Text style={styles.cityText}>{user.current_city_name}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.controlsContainer}>
              <View style={styles.territorySizeContainer}>
                <Text style={styles.territorySizeText}>
                  {(territorySize * 1000000).toFixed(0)} m² territory conquered
                </Text>
              </View>

              {isWalking && (
                <View style={styles.walkStatsContainer}>
                  <Text style={styles.walkStatsText}>
                    {(currentWalkDistance * 1000).toFixed(0)}m walked • {currentWalkPoints.length} points
                  </Text>
                </View>
              )}

              <View style={styles.bottomControlsRow}>
                <TouchableOpacity 
                  style={getButtonStyle()}
                  onPress={toggleWalking}
                  disabled={!isWalking && !canStartConquest && !isSubscribed}
                >
                  {isWalking ? (
                    <Pause size={24} color={COLORS.white} />
                  ) : (
                    <Play size={24} color={COLORS.white} />
                  )}
                  <Text style={styles.startWalkText}>
                    {getButtonText()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.locateButton}
                  onPress={handleLocateMe}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Locate size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          <PawsModal 
            visible={showPawsModal}
            onClose={() => setShowPawsModal(false)}
          />
          
          <MonthlyResetDialog
            visible={showMonthlyResetDialog}
            onClose={closeMonthlyResetDialog}
          />
          
          <CityChangeDialog
            visible={showCityChangeDialog}
            fromCity={user?.current_city_name || null}
            toCity={detectedCity?.name || ''}
            isLoading={isProcessingCityChange}
            onConfirm={handleConfirmCityChange}
            onCancel={() => setShowCityChangeDialog(false)}
          />

          {conquestSummaryData && (
            <ConquestSummaryDialog
              visible={showConquestSummary}
              onClose={() => setShowConquestSummary(false)}
              territoryGained={conquestSummaryData.territoryGained}
              distanceWalked={conquestSummaryData.distanceWalked}
              localRanking={conquestSummaryData.localRanking}
            />
          )}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {errorMsg || "Finding your location..."}
          </Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  walkPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginLeft: 6,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  territorySizeContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  territorySizeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  walkStatsContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walkStatsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.secondary,
  },
  bottomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  startWalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flex: 1,
    marginRight: 12,
  },
  activeButton: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    backgroundColor: COLORS.neutralMedium,
  },
  startWalkText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  locateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});