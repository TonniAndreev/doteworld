import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Camera, Edit, Save, X } from 'lucide-react-native';

interface Dog {
  id: string;
  name: string;
  breed: string;
  photo_path?: string;
  birthday?: string;
  bio?: string;
  weight?: number;
  gender: 'male' | 'female' | 'unknown';
  created_at: string;
  updated_at?: string;
}

export default function DogProfileScreen() {
  const [dog, setDog] = useState<Dog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDog, setEditedDog] = useState<Partial<Dog>>({});
  const [showBreedModal, setShowBreedModal] = useState(false);

  const commonBreeds = [
    'Labrador Retriever',
    'Golden Retriever',
    'German Shepherd',
    'French Bulldog',
    'Bulldog',
    'Poodle',
    'Beagle',
    'Rottweiler',
    'Yorkshire Terrier',
    'Dachshund',
    'Siberian Husky',
    'Mixed Breed',
    'Other',
  ];

  const handleSave = () => {
    if (!editedDog.name?.trim()) {
      Alert.alert('Error', 'Dog name is required');
      return;
    }

    // Here you would update the dog in your database
    console.log('Saving dog:', editedDog);
    setIsEditing(false);
    setEditedDog({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedDog({});
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (birthday?: string) => {
    if (!birthday) return 'Unknown';
    const birthDate = new Date(birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return `${age - 1} years old`;
    }
    return `${age} years old`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dog Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <X size={24} color="#333" />
            ) : (
              <Edit size={24} color="#333" />
            )}
          </TouchableOpacity>
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {dog?.photo_path ? (
              <Image source={{ uri: dog.photo_path }} style={styles.dogPhoto} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Camera size={40} color="#666" />
                <Text style={styles.placeholderText}>No Photo</Text>
              </View>
            )}
            {isEditing && (
              <TouchableOpacity style={styles.photoEditButton}>
                <Camera size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedDog.name || dog?.name || ''}
                onChangeText={(text) => setEditedDog({ ...editedDog, name: text })}
                placeholder="Enter dog's name"
              />
            ) : (
              <Text style={styles.value}>{dog?.name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed</Text>
            {isEditing ? (
              <TouchableOpacity
                style={styles.breedSelector}
                onPress={() => setShowBreedModal(true)}
              >
                <Text style={styles.breedSelectorText}>
                  {editedDog.breed || dog?.breed || 'Select breed'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.value}>{dog?.breed || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            {isEditing ? (
              <View style={styles.genderContainer}>
                {['male', 'female', 'unknown'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      (editedDog.gender || dog?.gender) === gender && styles.genderButtonActive,
                    ]}
                    onPress={() => setEditedDog({ ...editedDog, gender: gender as any })}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        (editedDog.gender || dog?.gender) === gender && styles.genderButtonTextActive,
                      ]}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.value}>
                {dog?.gender ? dog.gender.charAt(0).toUpperCase() + dog.gender.slice(1) : 'Not set'}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birthday</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedDog.birthday || dog?.birthday || ''}
                onChangeText={(text) => setEditedDog({ ...editedDog, birthday: text })}
                placeholder="YYYY-MM-DD"
              />
            ) : (
              <View>
                <Text style={styles.value}>{formatDate(dog?.birthday)}</Text>
                {dog?.birthday && (
                  <Text style={styles.ageText}>{calculateAge(dog.birthday)}</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (lbs)</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedDog.weight?.toString() || dog?.weight?.toString() || ''}
                onChangeText={(text) => setEditedDog({ ...editedDog, weight: parseFloat(text) || undefined })}
                placeholder="Enter weight"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>
                {dog?.weight ? `${dog.weight} lbs` : 'Not set'}
              </Text>
            )}
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.inputGroup}>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editedDog.bio || dog?.bio || ''}
                onChangeText={(text) => setEditedDog({ ...editedDog, bio: text })}
                placeholder="Tell us about your dog..."
                multiline
                numberOfLines={4}
              />
            ) : (
              <Text style={styles.bioText}>
                {dog?.bio || 'No description available'}
              </Text>
            )}
          </View>
        </View>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Breed Selection Modal */}
      <Modal
        visible={showBreedModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Breed</Text>
            <TouchableOpacity onPress={() => setShowBreedModal(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.breedList}>
            {commonBreeds.map((breed) => (
              <TouchableOpacity
                key={breed}
                style={styles.breedItem}
                onPress={() => {
                  setEditedDog({ ...editedDog, breed });
                  setShowBreedModal(false);
                }}
              >
                <Text style={styles.breedItemText}>{breed}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoContainer: {
    position: 'relative',
  },
  dogPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 6,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 8,
  },
  ageText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  breedSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  breedSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  breedList: {
    flex: 1,
  },
  breedItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breedItemText: {
    fontSize: 16,
    color: '#333',
  },
});