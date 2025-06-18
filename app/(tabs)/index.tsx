import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Play, Pause, Locate, Zap } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '@/constants/theme';
import { useTerritory } from '@/contexts/TerritoryContext';
import { usePaws } from '@/contexts/PawsContext';
import ChallengesPanel from '@/components/home/ChallengesPanel';
import FloatingPawsBalance from '@/components/common/FloatingPawsBalance';
import { calculateDistance } from '@/utils/locationUtils';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkDistance, setWalkDistance] = useState(0);
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallengesCount, setActiveChallengesCount] = useState(2);
  const [isLocating, setIsLocating] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const challengesPanelAnimation = useRef(new Animated.Value(0)).current;
  const territorySizeAnimation = useRef(new Animated.Value(0)).current;
  
  const { 
    territory,
    territorySize,
    currentWalkPoints,
    currentPolygon,
    startWalk,
    addWalkPoint,
    endWalk,
  } = useTerritory();
  const { pawsBalance } = usePaws();

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

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({});
        setLocation(initialLocation);
        
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 5000,
          },
          (newLocation) => {
            setLocation(newLocation);

            if (isWalking && lastLocationRef.current) {
              const distance = calculateDistance(
                lastLocationRef.current.coords.latitude,
                lastLocationRef.current.coords.longitude,
                newLocation.coords.latitude,
                newLocation.coords.longitude
              );

              if (newLocation.coords.speed && newLocation.coords.speed < 2.5) {
                setWalkDistance(prev => prev + distance);
                addWalkPoint({
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude
                });
              }
            }

            lastLocationRef.current = newLocation;
            setLastLocation(newLocation);
          }
        );
      } catch (error) {
        console.error('Error setting up location:', error);
        setErrorMsg('Failed to initialize location services');
      }
    };

    setupLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isWalking]);
  
  const toggleWalking = () => {
    if (!isWalking) {
      setWalkDistance(0);
      setIsWalking(true);
      startWalk();
    } else {
      setIsWalking(false);
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
            followsUserLocation
            onPress={handleMapPress}
            zoomEnabled={true}
            rotateEnabled={true}
            scrollEnabled={true}
          >
            {territory.map((polygon, index) => (
              <Polygon
                key={index}
                coordinates={polygon}
                fillColor="rgba(138, 79, 255, 0.3)"
                strokeColor={COLORS.primary}
                strokeWidth={2}
              />
            ))}
            
            {currentWalkPoints.length > 0 && (
              <>
                <Polyline
                  coordinates={currentWalkPoints}
                  strokeColor={COLORS.primary}
                  strokeWidth={3}
                />
                {currentWalkPoints.map((point, index) => (
                  <Marker
                    key={`point-${index}`}
                    coordinate={point}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.walkPoint} />
                  </Marker>
                ))}
              </>
            )}
            
            {currentPolygon && (
              <Polygon
                coordinates={currentPolygon}
                fillColor="rgba(138, 79, 255, 0.2)"
                strokeColor={COLORS.primary}
                strokeWidth={2}
                strokeDashPattern={[5, 5]}
              />
            )}
          </MapView>

          <SafeAreaView style={styles.overlay} pointerEvents="box-none">
            <View style={styles.topBar}>
              <FloatingPawsBalance balance={pawsBalance} />
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
                  {(territorySize * 1000).toFixed(0)} m² territory conquered
                </Text>
              </Animated.View>

              <View style={styles.bottomControlsRow}>
                <TouchableOpacity style={styles.boltLogoContainer}>
                  <Zap size={24} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.startWalkButton, isWalking && styles.activeButton]}
                  onPress={toggleWalking}
                >
                  {isWalking ? (
                    <Pause size={24} color={COLORS.white} />
                  ) : (
                    <Play size={24} color={COLORS.white} />
                  )}
                  <Text style={styles.startWalkText}>
                    {isWalking ? 'Finish Conquest' : 'Conquer Territory'}
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
    fontFamily: 'SF-Pro-Display-Regular',
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
    fontFamily: 'SF-Pro-Display-Medium',
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
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  bottomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  boltLogoContainer: {
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
  startWalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 12,
  },
  activeButton: {
    backgroundColor: COLORS.error,
  },
  startWalkText: {
    fontFamily: 'SF-Pro-Display-Bold',
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