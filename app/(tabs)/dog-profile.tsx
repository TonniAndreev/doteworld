import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ChevronLeft, Plus, CreditCard as Edit, Calendar, Scale, ChevronDown, Search, X, Check, Camera } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import NotificationsButton from '@/components/common/NotificationsButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import DogProfileCard from '@/components/profile/DogProfileCard';
import { useDogOwnership } from '@/hooks/useDogOwnership';

// Same breed list as in dog-profile creation
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

interface Dog {
  id: string;
  name: string;
  breed: string;
  photo_url?: string | null;
  birthday?: string;
  bio?: string;
  weight?: number;
  gender?: 'male' | 'female';
  created_at: string;
}

export default function DogProfileScreen() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [breedSearchQuery, setBreedSearchQuery] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    breed: '',
    birthday: '',
    bio: '',
    weight: '',
    gender: '' as 'male' | 'female' | '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newDogPhoto, setNewDogPhoto] = useState<string | null>(null);

  const { user, refreshUserData } = useAuth();
  const { updateDogData } = useDogOwnership();

  useEffect(() => {
    if (user) {
      fetchUserDogs();
    }
  }, [user]);

  const fetchUserDogs = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch user's dogs with all details
      const { data: userDogs, error } = await supabase
        .from('profile_dogs')
        .select(`
          dogs (
            id,
            name,
            breed,
            photo_url,
            birthday,
            bio,
            weight,
            gender,
            created_at
          )
        `)
        .eq('profile_id', user.id);

      if (error) {
        console.error('Error fetching user dogs:', error);
        return;
      }

      const dogsData = userDogs?.map(ud => ud.dogs).filter(Boolean) || [];
      setDogs(dogsData as Dog[]);
    } catch (error) {
      console.error('Error fetching dogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDog = (dog: Dog) => {
    setSelectedDog(dog);
    setEditForm({
      name: dog.name,
      breed: dog.breed,
      birthday: dog.birthday || '',
      bio: dog.bio || '',
      weight: dog.weight?.toString() || '',
      gender: dog.gender || '',
    });
    setEditModalVisible(true);
  };

  const handleUpdatePhoto = (dog: Dog) => {
    setSelectedDog(dog);
    setNewDogPhoto(null);
    setPhotoModalVisible(true);
  };

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
        setNewDogPhoto(result.assets[0].uri);
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
        setNewDogPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedDog || !newDogPhoto) {
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Generate a unique filename
      const fileExt = newDogPhoto.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('Uploading to path:', filePath);
      
      // Use fetch to get blob from image URI
      const response = await fetch(newDogPhoto);
      const fileData = await response.blob();
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dog_photos')
        .upload(filePath, fileData, {
          contentType: fileData.type,
          upsert: true,
        });
      
      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw new Error('Failed to upload dog photo');
      }
      
      console.log('Upload successful:', uploadData);
      
      // Get public URL
      const { data: publicUrlData } = await supabase.storage
        .from('dog_photos')
        .getPublicUrl(filePath);
      
      console.log('Public URL:', publicUrlData);
      
      // Update dog record with new photo URL
      const { error: updateError } = await supabase
        .from('dogs')
        .update({
          photo_url: publicUrlData.publicUrl,
          photo_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDog.id);

      if (updateError) {
        console.error('Error updating dog photo:', updateError);
        throw new Error('Failed to update dog photo');
      }

      // Refresh dogs list
      await fetchUserDogs();
      setPhotoModalVisible(false);
      setSelectedDog(null);
      setNewDogPhoto(null);
      
      Alert.alert('Success', 'Dog photo updated successfully!');
    } catch (error) {
      console.error('Error saving dog photo:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update dog photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveDog = async () => {
    if (!selectedDog || !editForm.name.trim()) {
      Alert.alert('Error', 'Dog name is required');
      return;
    }

    if (!editForm.breed.trim()) {
      Alert.alert('Error', 'Dog breed is required');
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        name: editForm.name.trim(),
        breed: editForm.breed.trim(),
        bio: editForm.bio.trim(),
        gender: editForm.gender || null,
      };

      // Add birthday if provided
      if (editForm.birthday) {
        updateData.birthday = editForm.birthday;
      }

      // Add weight if provided and valid
      if (editForm.weight && !isNaN(parseFloat(editForm.weight))) {
        updateData.weight = parseFloat(editForm.weight);
      }

      // Use the hook to ensure proper data persistence
      const result = await updateDogData(selectedDog.id, updateData);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to update dog profile');
        return;
      }

      // Refresh dogs list
      await fetchUserDogs();
      setEditModalVisible(false);
      setSelectedDog(null);
      setShowBreedDropdown(false);
      setBreedSearchQuery('');
      
      Alert.alert('Success', 'Dog profile updated successfully!');
    } catch (error) {
      console.error('Error saving dog:', error);
      Alert.alert('Error', 'Failed to update dog profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDog = () => {
    router.push('/(auth)/dog-profile');
  };

  const handleBreedSelect = (breed: string) => {
    setEditForm(prev => ({ ...prev, breed }));
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

  // Filter and sort breeds based on search query
  const filteredBreeds = DOG_BREEDS.filter(breed =>
    breed.toLowerCase().includes(breedSearchQuery.toLowerCase())
  ).sort();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dog profiles...</Text>
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
        
        <Text style={styles.title}>Dog Profiles</Text>
        
        <View style={styles.headerButtons}>
          <NotificationsButton />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddDog}
          >
            <Plus size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Dogs Yet</Text>
            <Text style={styles.emptyText}>
              Add your first dog to start tracking walks and conquering territories!
            </Text>
            <TouchableOpacity 
              style={styles.addFirstDogButton}
              onPress={handleAddDog}
            >
              <Plus size={20} color={COLORS.white} />
              <Text style={styles.addFirstDogText}>Add Your First Dog</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dogsContainer}>
            {dogs.map((dog) => (
              <View key={dog.id} style={styles.dogCardContainer}>
                <DogProfileCard 
                  dog={dog} 
                  showFullDetails={true}
                />
                <View style={styles.dogCardActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditDog(dog)}
                  >
                    <Edit size={16} color={COLORS.white} />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.photoButton}
                    onPress={() => handleUpdatePhoto(dog)}
                  >
                    <Camera size={16} color={COLORS.white} />
                    <Text style={styles.photoButtonText}>Update Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Dog Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          setEditModalVisible(false);
          setShowBreedDropdown(false);
          setBreedSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Dog Profile</Text>
              <TouchableOpacity 
                onPress={() => {
                  setEditModalVisible(false);
                  setShowBreedDropdown(false);
                  setBreedSearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="Dog's name"
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>

              {/* Breed - Updated to use dropdown selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Breed *</Text>
                <TouchableOpacity 
                  style={styles.breedSelector}
                  onPress={() => setShowBreedDropdown(!showBreedDropdown)}
                >
                  <Text style={editForm.breed ? styles.breedText : styles.breedPlaceholder}>
                    {editForm.breed || 'Select breed'}
                  </Text>
                  <ChevronDown size={20} color={COLORS.neutralDark} />
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
                            {breed === editForm.breed && (
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

              {/* Birthday */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Birthday</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={20} color={COLORS.neutralMedium} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={editForm.birthday}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, birthday: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.neutralMedium}
                  />
                </View>
              </View>

              {/* Weight */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <View style={styles.inputWithIcon}>
                  <Scale size={20} color={COLORS.neutralMedium} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={editForm.weight}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, weight: text }))}
                    placeholder="Weight in kg"
                    placeholderTextColor={COLORS.neutralMedium}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderContainer}>
                  {(['male', 'female'] as const).map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderOption,
                        editForm.gender === gender && styles.genderOptionSelected,
                        !editForm.gender && gender === 'male' && styles.genderOptionDefault
                      ]}
                      onPress={() => setEditForm(prev => ({ 
                        ...prev, 
                        gender: prev.gender === gender ? '' : gender 
                      }))}
                    >
                      <Text style={[
                        styles.genderOptionText,
                        editForm.gender === gender && styles.genderOptionTextSelected,
                        !editForm.gender && gender === 'male' && styles.genderOptionTextDefault
                      ]}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* About - Removed tooltip icon */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>About</Text>
                <TextInput
                  style={[styles.textInput, styles.bioInput]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about your dog..."
                  placeholderTextColor={COLORS.neutralMedium}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveDog}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={photoModalVisible}
        onRequestClose={() => {
          setPhotoModalVisible(false);
          setNewDogPhoto(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Dog Photo</Text>
              <TouchableOpacity 
                onPress={() => {
                  setPhotoModalVisible(false);
                  setNewDogPhoto(null);
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photoModalContent}>
              <View style={styles.photoPreviewContainer}>
                {newDogPhoto ? (
                  <Image 
                    source={{ uri: newDogPhoto }} 
                    style={styles.photoPreview} 
                    resizeMode="cover"
                  />
                ) : selectedDog?.photo_url ? (
                  <Image 
                    source={{ uri: selectedDog.photo_url }} 
                    style={styles.photoPreview} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Camera size={40} color={COLORS.neutralMedium} />
                    <Text style={styles.photoPlaceholderText}>No photo selected</Text>
                  </View>
                )}
              </View>

              <View style={styles.photoActions}>
                <TouchableOpacity 
                  style={styles.photoActionButton}
                  onPress={takePhoto}
                >
                  <Camera size={20} color={COLORS.white} />
                  <Text style={styles.photoActionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoActionButton}
                  onPress={pickImage}
                >
                  <Plus size={20} color={COLORS.white} />
                  <Text style={styles.photoActionText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.photoHelpText}>
                Choose a clear photo of your dog. Square photos work best.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  !newDogPhoto && styles.disabledButton
                ]}
                onPress={handleSavePhoto}
                disabled={!newDogPhoto || isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {selectedDog?.photo_url ? 'Update Photo' : 'Add Photo'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  addButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addFirstDogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addFirstDogText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  dogsContainer: {
    gap: 16,
  },
  dogCardContainer: {
    position: 'relative',
  },
  dogCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 4,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  photoButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 4,
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
    maxHeight: '90%',
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
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.primary,
  },
  modalContent: {
    padding: 20,
  },
  photoModalContent: {
    padding: 20,
    alignItems: 'center',
  },
  photoPreviewContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: COLORS.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.neutralLight,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginTop: 8,
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  photoActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.white,
  },
  photoHelpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    backgroundColor: COLORS.neutralLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInputWithIcon: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginLeft: 12,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  breedSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.neutralLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  breedText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
  },
  breedPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
    marginTop: 8,
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
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.neutralLight,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  genderOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  genderOptionTextSelected: {
    color: COLORS.white,
  },
  genderOptionDefault: {
    backgroundColor: COLORS.neutralMedium,
  },
  genderOptionTextDefault: {
    color: COLORS.white,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralLight,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.neutralMedium,
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});