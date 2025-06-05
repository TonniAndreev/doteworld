import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, PawPrint, Award } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '@/constants/theme';
import { useTerritory } from '@/contexts/TerritoryContext';
import { usePaws } from '@/contexts/PawsContext';
import ChallengesPanel from '@/components/home/ChallengesPanel';
import FloatingPawsBalance from '@/components/common/FloatingPawsBalance';
import MapControls from '@/components/home/MapControls';
import { calculateDistance } from '@/utils/locationUtils';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkDistance, setWalkDistance] = useState(0);
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);
  const [showChallenges, setShowChallenges] = useState(false);
  
  const mapRef = useRef(null);
  const challengesPanelAnimation = useRef(new Animated.Value(0)).current;
  
  const { territory, updateTerritory, claimNewTerritory } = useTerritory();
  const { pawsBalance, addPaws } = usePaws();

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
            
            if (isWalking && lastLocation) {
              const distance = calculateDistance(
                lastLocation.coords.latitude,
                lastLocation.coords.longitude,
                newLocation.coords.latitude,
                newLocation.coords.longitude
              );
              
              if (newLocation.coords.speed && newLocation.coords.speed < 2.5) {
                setWalkDistance(prev => prev + distance);
                claimNewTerritory(newLocation.coords);
              }
            }
            
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
  }, [isWalking, lastLocation]);
  
  const toggleWalking = () => {
    if (!isWalking) {
      setWalkDistance(0);
      setIsWalking(true);
    } else {
      setIsWalking(false);
      const pawsEarned = Math.floor(walkDistance * 10);
      if (pawsEarned > 0) {
        addPaws(pawsEarned);
      }
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
            
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
            >
              <View style={styles.markerContainer}>
                <MapPin color={COLORS.primary} size={24} />
              </View>
            </Marker>
          </MapView>

          <SafeAreaView style={styles.overlay}>
            <View style={styles.topBar}>
              <FloatingPawsBalance balance={pawsBalance} />
              <TouchableOpacity 
                style={styles.challengesButton}
                onPress={toggleChallengesPanel}
              >
                <Award size={20} color={COLORS.primary} />
                <Text style={styles.challengesText}>2 Daily Challenges</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                style={styles.startWalkButton}
                onPress={toggleWalking}
              >
                <Text style={styles.startWalkText}>
                  {isWalking ? 'End Walk' : 'Start Walk'}
                </Text>
              </TouchableOpacity>
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
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginLeft: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  startWalkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  startWalkText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.white,
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