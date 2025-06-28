import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Route, Calendar, Clock, MapPin, Trophy, Share2, Thermometer, Wind, Droplets } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/utils/supabase';
import { getWalkPoints } from '@/utils/walkSessionService';
import MapView, { Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { createConvexHull, isValidPolygon } from '@/utils/locationUtils';

const { width: screenWidth } = Dimensions.get('window');

interface WalkSession {
  id: string;
  dog_id: string;
  started_at: string;
  ended_at?: string;
  distance: number;
  points_count: number;
  territory_gained: number;
  status: 'active' | 'completed' | 'cancelled';
  weather_conditions?: {
    temperature?: number;
    conditions?: string;
    humidity?: number;
    windSpeed?: number;
  };
  created_at: string;
  dog_name?: string;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

export default function WalkDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [walkSession, setWalkSession] = useState<WalkSession | null>(null);
  const [walkPoints, setWalkPoints] = useState<Coordinate[]>([]);
  const [walkPolygon, setWalkPolygon] = useState<Coordinate[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadWalkDetails();
    }
  }, [id]);

  const loadWalkDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch walk session details
      const { data: session, error: sessionError } = await supabase
        .from('walk_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) {
        console.error('Error fetching walk session:', sessionError);
        return;
      }

      // Fetch dog name
      const { data: dog } = await supabase
        .from('dogs')
        .select('name')
        .eq('id', session.dog_id)
        .single();

      // Fetch walk points
      const { points, error: pointsError } = await getWalkPoints(session.id);

      if (pointsError) {
        console.error('Error fetching walk points:', pointsError);
      } else {
        setWalkPoints(points);
        
        // Calculate map region based on points
        if (points.length > 0) {
          const latitudes = points.map(p => p.latitude);
          const longitudes = points.map(p => p.longitude);
          
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);
          
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          
          // Add some padding
          const latDelta = (maxLat - minLat) * 1.5 || 0.01;
          const lngDelta = (maxLng - minLng) * 1.5 || 0.01;
          
          setMapRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, 0.005),
            longitudeDelta: Math.max(lngDelta, 0.005),
          });
        }
        
        // Create polygon from points
        if (points.length >= 3) {
          const hull = createConvexHull(points);
          if (hull && isValidPolygon(hull)) {
            setWalkPolygon(hull);
          }
        }
      }

      setWalkSession({
        ...session,
        dog_name: dog?.name || 'Unknown Dog',
      });
    } catch (error) {
      console.error('Error loading walk details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    if (!endDate) return 'In progress';
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const durationMs = end - start;
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDistance = (distance: number) => {
    if (distance >= 1) {
      return `${distance.toFixed(2)} km`;
    } else {
      return `${(distance * 1000).toFixed(0)} m`;
    }
  };

  const formatTerritory = (territory: number) => {
    const squareMeters = territory * 1000000;
    if (squareMeters >= 10000) {
      return `${territory.toFixed(2)} km²`;
    } else {
      return `${squareMeters.toFixed(0)} m²`;
    }
  };

  const calculatePace = (): string => {
    if (!walkSession || !walkSession.distance || !walkSession.ended_at) return '-';
    
    const start = new Date(walkSession.started_at).getTime();
    const end = new Date(walkSession.ended_at).getTime();
    const durationMinutes = (end - start) / (1000 * 60);
    
    // Calculate minutes per kilometer
    const paceInMinPerKm = durationMinutes / walkSession.distance;
    
    const paceMinutes = Math.floor(paceInMinPerKm);
    const paceSeconds = Math.floor((paceInMinPerKm - paceMinutes) * 60);
    
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} min/km`;
  };

  const handleShare = async () => {
    if (!walkSession) return;
    
    try {
      await Share.share({
        message: `I just walked ${formatDistance(walkSession.distance)} with ${walkSession.dog_name} and conquered ${formatTerritory(walkSession.territory_gained)} of territory using Dote!`,
      });
    } catch (error) {
      console.error('Error sharing walk:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading walk details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!walkSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={COLORS.neutralDark} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Walk Details</Text>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Walk not found</Text>
          <TouchableOpacity
            style={styles.backToHistoryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToHistoryButtonText}>Back to History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Walk Details</Text>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Share2 size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          {mapRegion ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {walkPoints.length > 1 && (
                <Polyline
                  coordinates={walkPoints}
                  strokeColor={COLORS.primary}
                  strokeWidth={4}
                  lineDashPattern={[0]}
                />
              )}
              
              {walkPolygon && (
                <Polygon
                  coordinates={walkPolygon}
                  fillColor="rgba(241, 102, 46, 0.2)"
                  strokeColor={COLORS.primary}
                  strokeWidth={2}
                />
              )}
            </MapView>
          ) : (
            <View style={[styles.map, styles.mapPlaceholder]}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.fullMapButton}
            onPress={() => {
              // Navigate to full map view
              // This would be implemented in a future update
              alert('Full map view coming soon!');
            }}
          >
            <Text style={styles.fullMapButtonText}>View Full Map</Text>
          </TouchableOpacity>
        </View>

        {/* Walk Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.dogName}>{walkSession.dog_name}</Text>
          
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Calendar size={16} color={COLORS.neutralMedium} />
              <Text style={styles.dateText}>
                {formatDate(walkSession.started_at)}
              </Text>
            </View>
            
            <View style={styles.timeContainer}>
              <Clock size={16} color={COLORS.neutralMedium} />
              <Text style={styles.timeText}>
                {formatTime(walkSession.started_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Route size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>
              {formatDistance(walkSession.distance)}
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Clock size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>
              {formatDuration(walkSession.started_at, walkSession.ended_at)}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statCard}>
            <Trophy size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>
              {formatTerritory(walkSession.territory_gained)}
            </Text>
            <Text style={styles.statLabel}>Territory</Text>
          </View>
          
          <View style={styles.statCard}>
            <MapPin size={24} color={COLORS.tertiary} />
            <Text style={styles.statValue}>
              {walkSession.points_count}
            </Text>
            <Text style={styles.statLabel}>GPS Points</Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStatsContainer}>
          <Text style={styles.sectionTitle}>Performance</Text>
          
          <View style={styles.additionalStatRow}>
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Pace</Text>
              <Text style={styles.additionalStatValue}>{calculatePace()}</Text>
            </View>
            
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Calories</Text>
              <Text style={styles.additionalStatValue}>
                ~{Math.round(walkSession.distance * 60)} cal
              </Text>
            </View>
            
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Avg. Speed</Text>
              <Text style={styles.additionalStatValue}>
                {walkSession.ended_at ? 
                  `${(walkSession.distance / ((new Date(walkSession.ended_at).getTime() - new Date(walkSession.started_at).getTime()) / 3600000)).toFixed(1)} km/h` : 
                  '-'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Weather Conditions */}
        {walkSession.weather_conditions && (
          <View style={styles.weatherContainer}>
            <Text style={styles.sectionTitle}>Weather Conditions</Text>
            
            <View style={styles.weatherContent}>
              {walkSession.weather_conditions.temperature !== undefined && (
                <View style={styles.weatherItem}>
                  <Thermometer size={20} color={COLORS.primary} />
                  <Text style={styles.weatherValue}>
                    {walkSession.weather_conditions.temperature}°C
                  </Text>
                </View>
              )}
              
              {walkSession.weather_conditions.conditions && (
                <View style={styles.weatherItem}>
                  <Text style={styles.weatherValue}>
                    {walkSession.weather_conditions.conditions}
                  </Text>
                </View>
              )}
              
              {walkSession.weather_conditions.humidity !== undefined && (
                <View style={styles.weatherItem}>
                  <Droplets size={20} color={COLORS.secondary} />
                  <Text style={styles.weatherValue}>
                    {walkSession.weather_conditions.humidity}%
                  </Text>
                </View>
              )}
              
              {walkSession.weather_conditions.windSpeed !== undefined && (
                <View style={styles.weatherItem}>
                  <Wind size={20} color={COLORS.tertiary} />
                  <Text style={styles.weatherValue}>
                    {walkSession.weather_conditions.windSpeed} km/h
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  shareButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
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
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  backToHistoryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backToHistoryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    backgroundColor: COLORS.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMapButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullMapButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.primary,
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  dogName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  statCard: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  additionalStatsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  additionalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  additionalStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 4,
  },
  additionalStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  weatherContainer: {
    padding: 16,
  },
  weatherContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralExtraLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  weatherValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
});