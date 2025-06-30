import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { MapPin, ChevronDown, Check, Search, X, Plus, Globe, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { reverseGeocodeToCity, getOrCreateCityInSupabase, updateUserCity } from '@/utils/geocoding';
import { useAuth } from '@/contexts/AuthContext';
import { formatCityName } from '@/utils/formatUtils';

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
  territorySize?: number;
}

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  isLoading: boolean;
  onSelectCity: (city: City) => void;
}

export default function CitySelector({ 
  cities, 
  selectedCity, 
  isLoading,
  onSelectCity 
}: CitySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityCountry, setNewCityCountry] = useState('');
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const { user } = useAuth();

  // Filter cities based on search query
  const filteredCities = cities.filter(city => {
    const query = searchQuery.toLowerCase();
    return (
      city.name.toLowerCase().includes(query) ||
      (city.state && city.state.toLowerCase().includes(query)) ||
      city.country.toLowerCase().includes(query)
    );
  });

  const openModal = () => {
    setModalVisible(true);
    setSearchQuery('');
    setShowAddCity(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    setShowAddCity(false);
  };

  const handleSelectCity = (city: City) => {
    onSelectCity(city);
    closeModal();
  };

  const formatCityDisplay = (city: City) => {
    return formatCityName(city.name, city.country);
  };

  const formatTerritorySize = (size?: number) => {
    if (size === undefined || size === 0) return '0 m²';
    return `${(size * 1000000).toFixed(0)} m²`;
  };

  const handleAddCity = async () => {
    if (!newCityName.trim() || !newCityCountry.trim()) {
      Alert.alert('Error', 'City name and country are required');
      return;
    }

    setIsAddingCity(true);
    try {
      // Create a city details object
      const cityDetails = {
        name: newCityName.trim(),
        state: null,
        country: newCityCountry.trim(),
        lat: 0, // Default values, will be updated if location is detected
        lon: 0
      };

      // Try to get current location for coordinates
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          cityDetails.lat = location.coords.latitude;
          cityDetails.lon = location.coords.longitude;
        }
      } catch (error) {
        console.log('Could not get location for new city:', error);
        // Continue without coordinates
      }

      // Create city in database
      const cityId = await getOrCreateCityInSupabase(cityDetails);
      if (!cityId) {
        throw new Error('Failed to create city');
      }

      // Create new city object
      const newCity: City = {
        id: cityId,
        name: newCityName.trim(),
        state: null,
        country: newCityCountry.trim(),
        territorySize: 0
      };

      // Select the new city
      onSelectCity(newCity);
      
      // Reset form and close modal
      setNewCityName('');
      setNewCityCountry('');
      setShowAddCity(false);
      closeModal();
      
      Alert.alert('Success', `Added ${newCity.name} to your cities`);
    } catch (error) {
      console.error('Error adding city:', error);
      Alert.alert('Error', 'Failed to add city. Please try again.');
    } finally {
      setIsAddingCity(false);
    }
  };

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to detect your city');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      // Get city from coordinates
      const cityDetails = await reverseGeocodeToCity(
        location.coords.latitude,
        location.coords.longitude
      );
      
      if (cityDetails) {
        const cityId = await getOrCreateCityInSupabase(cityDetails);
        if (cityId) {
          // Create new city object
          const newCity: City = {
            id: cityId,
            name: cityDetails.name,
            state: cityDetails.state,
            country: cityDetails.country,
            territorySize: 0
          };
          
          // Select the new city and close modal
          onSelectCity(newCity);
          closeModal();
          
          Alert.alert('Success', `Added ${cityDetails.name}, ${cityDetails.country} to your cities`);
        } else {
          Alert.alert('Error', 'Could not create city in database');
        }
      } else {
        Alert.alert('Error', 'Could not determine your city from your location');
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert('Error', 'Failed to detect your location. Please try again.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const renderCityItem = ({ item }: { item: City }) => {
    const isCurrentUserCity = user?.current_city_id === item.id;
    const formattedCityName = formatCityDisplay(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.cityItem,
          selectedCity?.id === item.id && styles.selectedCityItem,
          isCurrentUserCity && styles.currentUserCityItem
        ]}
        onPress={() => handleSelectCity(item)}
      >
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>
            {formattedCityName}
            {isCurrentUserCity && <Text style={styles.currentCityBadge}> (Current)</Text>}
          </Text>
        </View>
        
        <View style={styles.cityStats}>
          <Text style={styles.territorySize}>
            {formatTerritorySize(item.territorySize)}
          </Text>
          {selectedCity?.id === item.id && (
            <Check size={20} color={COLORS.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.selector}
        onPress={openModal}
        disabled={isLoading}
      >
        <MapPin size={20} color={COLORS.primary} style={styles.icon} />
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading cities...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.cityText} numberOfLines={1}>
              {selectedCity ? formatCityDisplay(selectedCity) : 'Select City'}
            </Text>
            <ChevronDown size={20} color={COLORS.neutralDark} />
          </>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View 
              style={styles.modalContainer}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showAddCity ? 'Add New City' : 'Select City'}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={showAddCity ? () => setShowAddCity(false) : closeModal}
                >
                  <Text style={styles.closeButtonText}>
                    {showAddCity ? 'Back' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showAddCity ? (
                <ScrollView style={styles.addCityContainer}>
                  <Text style={styles.addCityDescription}>
                    Detect your current location to add a new city
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.detectLocationButton}
                    onPress={detectCurrentLocation}
                    disabled={isDetectingLocation}
                  >
                    {isDetectingLocation ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Navigation size={16} color={COLORS.white} />
                        <Text style={styles.detectLocationText}>
                          Detect My Location
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <>
                  <View style={styles.searchContainer}>
                    <Search size={20} color={COLORS.neutralDark} style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search cities..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor={COLORS.neutralMedium}
                      autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <X size={20} color={COLORS.neutralMedium} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Special Options Section */}
                  <View style={styles.specialOptionsContainer}>
                    {user?.current_city_id && user?.current_city_name && (
                      <TouchableOpacity 
                        style={styles.specialOption}
                        onPress={() => handleSelectCity({
                          id: user.current_city_id!,
                          name: user.current_city_name!.split(',')[0].trim(),
                          state: null,
                          country: user.current_city_name!.split(',')[1]?.trim() || 'Unknown'
                        })}
                      >
                        <MapPin size={20} color={COLORS.primary} />
                        <Text style={styles.specialOptionText}>Your Current City: {user.current_city_name}</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.addNewCityOption}
                      onPress={() => setShowAddCity(true)}
                    >
                      <Plus size={20} color={COLORS.white} />
                      <Text style={styles.addNewCityOptionText}>Add a New City</Text>
                    </TouchableOpacity>
                  </View>

                  {cities.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Globe size={32} color={COLORS.neutralMedium} />
                      <Text style={styles.emptyText}>
                        No cities found. Start conquering territories to see cities here!
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.resultsHeader}>
                        <Text style={styles.resultsCount}>
                          {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'} found
                        </Text>
                      </View>
                      
                      <FlatList
                        data={filteredCities}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCityItem}
                        contentContainerStyle={styles.cityList}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                          searchQuery.length > 0 ? (
                            <View style={styles.noResultsContainer}>
                              <Text style={styles.noResultsText}>
                                No cities match "{searchQuery}"
                              </Text>
                              <TouchableOpacity 
                                style={styles.addNewFromSearchButton}
                                onPress={() => {
                                  setNewCityName(searchQuery);
                                  setNewCityCountry('');
                                  setShowAddCity(true);
                                }}
                              >
                                <Plus size={16} color={COLORS.primary} />
                                <Text style={styles.addNewFromSearchText}>
                                  Add "{searchQuery}" as a new city
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : null
                        }
                      />
                    </>
                  )}
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  cityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  specialOptionsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  specialOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralExtraLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  specialOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  addNewCityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  addNewCityOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  resultsCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  cityList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  selectedCityItem: {
    backgroundColor: COLORS.primaryExtraLight,
  },
  currentUserCityItem: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: 8,
  },
  cityInfo: {
    flex: 1,
    marginRight: 8,
  },
  cityName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  currentCityBadge: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  cityRegion: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  cityStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  territorySize: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  addNewFromSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addNewFromSearchText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  addCityContainer: {
    padding: 16,
  },
  addCityDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    backgroundColor: COLORS.neutralLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  detectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  detectLocationText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  addCityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  addCityButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});