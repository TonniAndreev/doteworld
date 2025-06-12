import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, ChevronDown, AlertCircle, Check } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const DOG_BREEDS = [
  'Labrador Retriever',
  'German Shepherd',
  'Golden Retriever',
  'French Bulldog',
  'Beagle',
  'Poodle',
  'Boxer',
  'Dachshund',
  'Siberian Husky',
  'Border Collie',
  'Mixed Breed / Other',
];

export default function DogProfileScreen() {
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogPhoto, setDogPhoto] = useState(null);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { updateDogProfile } = useAuth();
  
  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Web implementation using HTML input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setDogPhoto(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // For native platforms, you would use expo-image-picker
      alert('Image picker not available on this platform');
    }
  };
  
  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      // Web implementation using camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // For simplicity, we'll just use the file picker on web
        pickImage();
      } catch (error) {
        console.error('Camera access denied:', error);
        pickImage(); // Fallback to file picker
      }
    } else {
      // For native platforms, you would use expo-camera
      alert('Camera not available on this platform');
    }
  };
  
  const handleBreedSelect = (breed) => {
    setDogBreed(breed);
    setShowBreedDropdown(false);
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
      await updateDogProfile(dogName, dogBreed, dogPhoto);
      router.replace('/(tabs)');
    } catch (error) {
      setError('Failed to save dog profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            {dogPhoto ? (
              <Image source={{ uri: dogPhoto }} style={styles.dogPhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={40} color={COLORS.neutralMedium} />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
            
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
            
            {showBreedDropdown && (
              <View style={styles.dropdownContainer}>
                <ScrollView style={styles.dropdown} nestedScrollEnabled={true}>
                  {DOG_BREEDS.map((breed, index) => (
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
                  ))}
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
    width: 160,
    height: 160,
    borderRadius: 80,
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
  },
  breedPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
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
});