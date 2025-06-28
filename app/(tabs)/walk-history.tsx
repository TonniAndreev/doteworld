import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Route, Calendar, Clock, MapPin, Trophy, ArrowRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { getWalkSessions } from '@/utils/walkSessionService';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { extractPolygonCoordinates } from '@/utils/locationUtils';

interface WalkSession {
  id: string;
  dog_id: string;
  started_at: string;
  ended_at?: string;
  distance: number;
  points_count: number;
  territory_gained: number;
  status: 'active' | 'completed' | 'cancelled';
  weather_conditions?: any;
  created_at: string;
  dog_name?: string;
}

export default function WalkHistoryScreen() {
  const [walkSessions, setWalkSessions] = useState<WalkSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.dogs.length > 0) {
      setSelectedDogId(user.dogs[0].id);
      loadWalkSessions(user.dogs[0].id);
    }
  }, [user]);

  const loadWalkSessions = async (dogId: string) => {
    setIsLoading(true);
    try {
      const { sessions, error } = await getWalkSessions(dogId, 20, 'completed');
      
      if (error) {
        console.error('Error loading walk sessions:', error);
        return;
      }
      
      // Fetch dog names for each session
      const sessionsWithDogNames = await Promise.all(
        sessions.map(async (session) => {
          const { data: dog } = await supabase
            .from('dogs')
            .select('name')
            .eq('id', session.dog_id)
            .single();
            
          return {
            ...session,
            dog_name: dog?.name || 'Unknown Dog'
          };
        })
      );
      
      setWalkSessions(sessionsWithDogNames);
    } catch (error) {
      console.error('Error loading walk history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDogChange = (dogId: string) => {
    setSelectedDogId(dogId);
    loadWalkSessions(dogId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
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

  const renderWalkItem = ({ item }: { item: WalkSession }) => (
    <TouchableOpacity 
      style={styles.walkItem}
      onPress={() => router.push(`/walk-details/${item.id}`)}
    >
      <View style={styles.walkHeader}>
        <View style={styles.walkInfo}>
          <Text style={styles.walkDate}>{formatDate(item.started_at)}</Text>
          <Text style={styles.walkDogName}>{item.dog_name}</Text>
        </View>
        
        <ArrowRight size={20} color={COLORS.neutralMedium} />
      </View>
      
      <View style={styles.walkStats}>
        <View style={styles.walkStat}>
          <Route size={16} color={COLORS.primary} />
          <Text style={styles.walkStatValue}>{formatDistance(item.distance)}</Text>
        </View>
        
        <View style={styles.walkStat}>
          <Clock size={16} color={COLORS.secondary} />
          <Text style={styles.walkStatValue}>
            {formatDuration(item.started_at, item.ended_at)}
          </Text>
        </View>
        
        <View style={styles.walkStat}>
          <Trophy size={16} color={COLORS.accent} />
          <Text style={styles.walkStatValue}>
            {formatTerritory(item.territory_gained)}
          </Text>
        </View>
      </View>
      
      <View style={styles.mapPreviewContainer}>
        <Image
          source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=37.7749,-122.4194&zoom=13&size=600x200&maptype=roadmap&key=YOUR_API_KEY` }}
          style={styles.mapPreview}
          resizeMode="cover"
        />
        <View style={styles.mapOverlay} />
        <Text style={styles.viewDetailsText}>View Details</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Walk History</Text>
        
        <View style={styles.placeholder} />
      </View>

      {user && user.dogs.length > 0 && (
        <View style={styles.dogSelector}>
          <FlatList
            data={user.dogs}
            keyExtractor={(dog) => dog.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: dog }) => (
              <TouchableOpacity
                style={[
                  styles.dogItem,
                  selectedDogId === dog.id && styles.selectedDogItem
                ]}
                onPress={() => handleDogChange(dog.id)}
              >
                <Text style={[
                  styles.dogItemText,
                  selectedDogId === dog.id && styles.selectedDogItemText
                ]}>
                  {dog.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.dogList}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading walk history...</Text>
        </View>
      ) : (
        <FlatList
          data={walkSessions}
          keyExtractor={(item) => item.id}
          renderItem={renderWalkItem}
          contentContainerStyle={styles.walkList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Route size={64} color={COLORS.neutralMedium} />
              <Text style={styles.emptyTitle}>No Walks Yet</Text>
              <Text style={styles.emptyText}>
                Start a walk to conquer territory and track your progress!
              </Text>
              <TouchableOpacity
                style={styles.startWalkButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.startWalkButtonText}>Start a Walk</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  placeholder: {
    width: 40,
  },
  dogSelector: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  dogList: {
    paddingHorizontal: 16,
  },
  dogItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.neutralLight,
  },
  selectedDogItem: {
    backgroundColor: COLORS.primary,
  },
  dogItemText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  selectedDogItemText: {
    color: COLORS.white,
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
  walkList: {
    padding: 16,
  },
  walkItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  walkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  walkInfo: {
    flex: 1,
  },
  walkDate: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  walkDogName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  walkStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  walkStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walkStatValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginLeft: 6,
  },
  mapPreviewContainer: {
    height: 120,
    position: 'relative',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsText: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  startWalkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  startWalkButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});