import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Play, Pause, Locate } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '@/constants/theme';
import { useTerritory } from '@/contexts/TerritoryContext';
import { usePaws } from '@/contexts/PawsContext';
import ChallengesPanel from '@/components/home/ChallengesPanel';
import FloatingPawsBalance from '@/components/common/FloatingPawsBalance';
import PawsModal from '@/components/home/PawsModal';
import { calculateDistance } from '@/utils/locationUtils';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkDistance, setWalkDistance] = useState(0);
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallengesCount, setActiveChallengesCount] = useState(2);
  const [isLocating, setIsLocating] = useState(false);
  const [showPawsModal, setShowPawsModal] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const challengesPanelAnimation = useRef(new Animated.Value(0)).current;
  const territorySizeAnimation = useRef(new Animated.Value(0)).current;
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);
  
  const { 
    territory,
    territorySize,
    currentWalkPoints,
    currentPolygon,
    startWalk,
    addWalkPoint,
    endWalk,
  } = useTerritory();
  
  const { canStartConquest, startConquest, isSubscribed } = usePaws();

  useEffect(() => {
    if (isWalking) {
      Animated.spring(territorySizeAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(territorySizeAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [isWalking]);

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
      } catch (error) {
        console.error('Error getting initial location:', error);
        setErrorMsg('Failed to get your location');
      }
    };

    setupInitialLocation();
  }, []);

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
      startWalk();
      
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
      
      endWalk();
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

  const toggleChallengesPanel = () => {
    Animated.spring(challengesPanelAnimation, {
      toValue: showChallenges ? 0 : 1,
      useNativeDriver: true,
    }).start(() => {
      setShowChallenges(!showChallenges);
    });
  };

  const handleMapPress = () => {
    if (showChallenges) {
      Animated.spring(challengesPanelAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        setShowChallenges(false);
      });
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
            onPress={handleMapPress}
            zoomEnabled={true}
            rotateEnabled={true}
            scrollEnabled={true}
          >
            {/* Render conquered territories */}
            {territory.map((polygon, index) => (
              <Polygon
                key={`territory-${index}`}
                coordinates={polygon}
                fillColor="rgba(241, 102, 46, 0.3)"
                strokeColor={COLORS.primary}
                strokeWidth={2}
              />
            ))}
            
            {/* Render current walk path */}
            {currentWalkPoints.length > 0 && (
              <Polyline
                coordinates={currentWalkPoints}
                strokeColor={COLORS.primary}
                strokeWidth={3}
              />
            )}
            
            {/* Render current polygon preview with dashed border and more transparent fill */}
            {currentPolygon && (
              <Polygon
                coordinates={currentPolygon}
                fillColor="rgba(241, 102, 46, 0.15)"
                strokeColor={COLORS.primary}
                strokeWidth={2}
                strokeDashPattern={[10, 5]}
              />
            )}
          </MapView>

          <SafeAreaView style={styles.overlay} pointerEvents="box-none">
            <View style={styles.topBar}>
              <FloatingPawsBalance />
              <TouchableOpacity 
                style={styles.challengesButton}
                onPress={toggleChallengesPanel}
              >
                <Text style={styles.challengesText}>
                  {activeChallengesCount} Daily Challenge{activeChallengesCount !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.controlsContainer}>
              <Animated.View 
                style={[
                  styles.territorySizeContainer,
                  {
                    transform: [
                      {
                        translateY: territorySizeAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [100, 0],
                        }),
                      },
                    ],
                    opacity: territorySizeAnimation,
                  },
                ]}
              >
                <Text style={styles.territorySizeText}>
                  {(territorySize * 1000000).toFixed(0)} m² territory conquered
                </Text>
              </Animated.View>

              {isWalking && (
                <View style={styles.walkStatsContainer}>
                  <Text style={styles.walkStatsText}>
                    {(walkDistance * 1000).toFixed(0)}m walked • {currentWalkPoints.length} points
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
          
          {showChallenges && (
            <Animated.View 
              style={[
                styles.challengesContainer,
                {
                  transform: [
                    {
                      translateY: challengesPanelAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ChallengesPanel 
                walkDistance={walkDistance} 
                onClose={() => {
                  Animated.spring(challengesPanelAnimation, {
                    toValue: 0,
                    useNativeDriver: true,
                  }).start(() => {
                    setShowChallenges(false);
                  });
                }}
              />
            </Animated.View>
          )}

          <PawsModal 
            visible={showPawsModal}
            onClose={() => setShowPawsModal(false)}
          />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  challengesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengesText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
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
  challengesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
});