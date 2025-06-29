import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { MapPin, ChevronDown, Check } from 'lucide-react-native';

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
  const [modalVisible, setModalVisible] = React.useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSelectCity = (city: City) => {
    onSelectCity(city);
    closeModal();
  };

  const formatCityName = (city: City) => {
    if (city.state) {
      return `${city.name}, ${city.state}`;
    }
    return `${city.name}, ${city.country}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.selector}
        onPress={openModal}
        disabled={isLoading || cities.length === 0}
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
              {selectedCity ? formatCityName(selectedCity) : 'Select City'}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {cities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MapPin size={32} color={COLORS.neutralMedium} />
                <Text style={styles.emptyText}>
                  No cities found. Start conquering territories to see cities here!
                </Text>
              </View>
            ) : (
              <FlatList
                data={cities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.cityItem,
                      selectedCity?.id === item.id && styles.selectedCityItem
                    ]}
                    onPress={() => handleSelectCity(item)}
                  >
                    <View style={styles.cityInfo}>
                      <Text style={styles.cityName}>{item.name}</Text>
                      <Text style={styles.cityRegion}>
                        {item.state ? `${item.state}, ${item.country}` : item.country}
                      </Text>
                      {item.territorySize !== undefined && (
                        <Text style={styles.territorySize}>
                          {(item.territorySize * 1000000).toFixed(0)} m² conquered
                        </Text>
                      )}
                    </View>
                    {selectedCity?.id === item.id && (
                      <Check size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.cityList}
              />
            )}
          </View>
        </View>
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
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  cityRegion: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 4,
  },
  territorySize: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.primary,
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
});