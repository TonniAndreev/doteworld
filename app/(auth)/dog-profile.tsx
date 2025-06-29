import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, CircleAlert as AlertCircle, Check, Search, X, Calendar } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';

const DOG_BREEDS = [
  // Popular breeds
  'Labrador Retriever',
  'Golden Retriever',
  'German Shepherd',
  'French Bulldog',
  'Beagle',
  'Poodle',
  'Boxer',
  'Dachshund',
  'Siberian Husky',
  'Border Collie',
  
  // Small breeds
  'Chihuahua',
  'Pomeranian',
  'Yorkshire Terrier',
  'Maltese',
  'Pug',
  'Shih Tzu',
  'Cavalier King Charles Spaniel',
  'Boston Terrier',
  'Cocker Spaniel',
  'Jack Russell Terrier',
  'West Highland White Terrier',
  'Corgi (Pembroke Welsh)',
  
  // Medium breeds
  'Australian Shepherd',
  'Brittany',
  'English Springer Spaniel',
  'American Staffordshire Terrier',
  'Whippet',
  'Australian Cattle Dog',
  'Basenji',
  'Basset Hound',
  'Bichon Frise',
  'Dalmatian',
  'English Bulldog',
  'Portuguese Water Dog',
  'Samoyed',
  'Shiba Inu',
  
  // Large breeds
  'Rottweiler',
  'Doberman Pinscher',
  'Weimaraner',
  'Vizsla',
  'Rhodesian Ridgeback',
  'Akita',
  'Alaskan Malamute',
  'Bloodhound',
  'Greyhound',
  'Old English Sheepdog',
  'Pointer',
  'Swiss Shepherd',
  
  // Giant breeds
  'Great Dane',
  'Saint Bernard',
  'Mastiff',
  'Newfoundland',
  'Irish Wolfhound',
  'Great Pyrenees',
  'Bernese Mountain Dog',
  'Leonberger',
  
  // Designer/Mixed breeds
  'Labradoodle',
  'Goldendoodle',
  'Cockapoo',
  'Schnoodle',
  'Puggle',
  'Bernedoodle',
  'Aussiedoodle',
  'Sheepadoodle',
  
  // Catch-all
  'Mixed Breed',
  'Other',
].sort(); // Sort alphabetically

export default function DogProfileScreen() {
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogBirthday, setDogBirthday] = useState('');
  const [dogPhoto, setDogPhoto] = useState<string | null>(null);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [breedSearchQuery, setBreedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { user, updateDogProfile } = useAuth();
  
  // Filter and sort breeds based on search query
  const filteredBreeds = DOG_BREEDS.filter(breed =>
    breed.toLowerCase().includes(breedSearchQuery.toLowerCase())
  ).sort();
  
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to select a photo.');
        return;
      }
      
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        console.log('Image picked:', result.assets[0].uri);
        setDogPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera permissions to take a photo.');
        return;
      }
      
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        console.log('Photo taken:', result.assets[0].uri);
        setDogPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  const handleBreedSelect = (breed: string) => {
    setDogBreed(breed);
    setShowBreedDropdown(false);
    setBreedSearchQuery('');
  };

  const clearBreedSearch = () => {
    setBreedSearchQuery('');
  };

  const closeBreedDropdown = () => {
    setShowBreedDropdown(false);
    setBreedSearchQuery('');
  };
  
  const handleSubmit = async () => {
    if (!dogName) {
      setError('Please enter your dog\'s name');
      return;
    }
    
    if (!dogBreed) {
      setError('Please select your dog\'s breed');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Submitting dog profile with photo:', !!dogPhoto);
      await updateDogProfile(dogName, dogBreed, dogPhoto, dogBirthday);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Dog profile submission error:', error);
      setError(error.message || 'Failed to save dog profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDateOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const days = [];

    // Generate years (current year back to 20 years ago)
    for (let year = currentYear; year >= currentYear - 20; year--) {
      years.push(year);
    }

    // Generate days 1-31
    for (let day = 1; day <= 31; day++) {
      days.push(day);
    }

    return { years, months, days };
  };

  const DatePickerModal = () => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(0);
    const [selectedDay, setSelectedDay] = useState(1);
    const { years, months, days } = generateDateOptions();

    const handleDateConfirm = () => {
      const date = new Date(selectedYear, selectedMonth, selectedDay);
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      setDogBirthday(formattedDate);
      setShowDatePicker(false);
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContainer}>
            <View style={styles.dateModalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.dateModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.dateModalTitle}>Select Birthday</Text>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={styles.dateModalConfirm}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnTitle}>Month</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[styles.dateOption, selectedMonth === index && styles.selectedDateOption]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[styles.dateOptionText, selectedMonth === index && styles.selectedDateOptionText]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnTitle}>Day</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dateOption, selectedDay === day && styles.selectedDateOption]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.dateOptionText, selectedDay === day && styles.selectedDateOptionText]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnTitle}>Year</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.dateOption, selectedYear === year && styles.selectedDateOption]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[styles.dateOptionText, selectedYear === year && styles.selectedDateOptionText]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Dog Profile</Text>
            <Text style={styles.subtitle}>Tell us about your furry friend</Text>
          </View>
          
          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.photoContainer}>
            <UserAvatar
              userId={user?.id || 'temp'}
              photoURL={dogPhoto}
              userName={dogName || 'Dog'}
              size={160}
              showFallback={!dogPhoto}
              style={styles.dogPhoto}
              isDogAvatar={true}
              dogBreed={dogBreed}
            />
            
            <View style={styles.photoButtons}>
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={takePhoto}
              >
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={pickImage}
              >
                <Text style={styles.photoButtonText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Dog's Name</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Max, Bella, etc."
              value={dogName}
              onChangeText={setDogName}
              placeholderTextColor={COLORS.neutralMedium}
            />
            
            <Text style={styles.inputLabel}>Dog's Breed</Text>
            <TouchableOpacity 
              style={styles.breedSelector}
              onPress={() => setShowBreedDropdown(!showBreedDropdown)}
            >
              <Text style={dogBreed ? styles.breedText : styles.breedPlaceholder}>
                {dogBreed || 'Select breed'}
              </Text>
              <ChevronDown size={20} color={COLORS.neutralDark} />
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>Birthday (Optional)</Text>
            <TouchableOpacity 
              style={styles.breedSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={COLORS.neutralMedium} />
              <Text style={dogBirthday ? styles.breedText : styles.breedPlaceholder}>
                {dogBirthday ? new Date(dogBirthday).toLocaleDateString() : 'Select birthday'}
              </Text>
            </TouchableOpacity>
            
            {showBreedDropdown && (
              <View style={styles.dropdownContainer}>
                {/* Search Header */}
                <View style={styles.searchHeader}>
                  <View style={styles.searchInputContainer}>
                    <Search size={16} color={COLORS.neutralMedium} style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search breeds..."
                      value={breedSearchQuery}
                      onChangeText={setBreedSearchQuery}
                      placeholderTextColor={COLORS.neutralMedium}
                      autoFocus={true}
                    />
                    {breedSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={clearBreedSearch} style={styles.clearButton}>
                        <X size={16} color={COLORS.neutralMedium} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity onPress={closeBreedDropdown} style={styles.closeDropdownButton}>
                    <X size={20} color={COLORS.neutralDark} />
                  </TouchableOpacity>
                </View>

                {/* Results Count */}
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsCount}>
                    {filteredBreeds.length} breed{filteredBreeds.length !== 1 ? 's' : ''} found
                  </Text>
                </View>

                {/* Breeds List */}
                <ScrollView style={styles.dropdown} nestedScrollEnabled={true}>
                  {filteredBreeds.length > 0 ? (
                    filteredBreeds.map((breed, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => handleBreedSelect(breed)}
                      >
                        <Text style={styles.dropdownItemText}>{breed}</Text>
                        {breed === dogBreed && (
                          <Check size={16} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No breeds found matching "{breedSearchQuery}"
                      </Text>
                      <Text style={styles.noResultsSubtext}>
                        Try a different search term or select "Other"
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save & Continue</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <DatePickerModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  dogPhoto: {
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 8,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  photoButton: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  photoButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  formContainer: {
    marginBottom: 32,
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
    marginBottom: 24,
  },
  breedSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.neutralLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  breedText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginLeft: 8,
  },
  breedPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    flex: 1,
    marginLeft: 8,
  },
  dropdownContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
    marginBottom: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 300,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  clearButton: {
    padding: 4,
  },
  closeDropdownButton: {
    padding: 8,
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
  dropdown: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  dropdownItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
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
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dateModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  dateModalCancel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
  dateModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
  },
  dateModalConfirm: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 300,
  },
  dateColumn: {
    flex: 1,
    paddingHorizontal: 10,
  },
  dateColumnTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    textAlign: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  dateScrollView: {
    flex: 1,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  selectedDateOption: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  dateOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  selectedDateOptionText: {
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
});