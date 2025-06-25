import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, Heart, Scale, Info } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface Dog {
  id: string;
  name: string;
  breed: string;
  photo_url?: string;
  birthday?: string;
  bio?: string;
  weight?: number;
  gender?: 'male' | 'female' | 'unknown';
  created_at: string;
}

interface DogProfileCardProps {
  dog: Dog;
  onPress?: () => void;
  showFullDetails?: boolean;
}

export default function DogProfileCard({ dog, onPress, showFullDetails = false }: DogProfileCardProps) {
  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''} old`;
      } else {
        return `${years}y ${months}m old`;
      }
    }
  };

  const formatBirthday = (birthday: string) => {
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return '♂';
      case 'female':
        return '♀';
      default:
        return '';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return COLORS.primary;
      case 'female':
        return COLORS.secondary;
      default:
        return COLORS.neutralMedium;
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.container, showFullDetails && styles.fullDetailsContainer]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Dog Photo */}
      <View style={styles.photoContainer}>
        {dog.photo_url ? (
          <Image 
            source={{ uri: dog.photo_url }} 
            style={styles.dogPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Heart size={32} color={COLORS.primary} />
          </View>
        )}
        
        {dog.gender && dog.gender !== 'unknown' && (
          <View style={[styles.genderBadge, { backgroundColor: getGenderColor(dog.gender) }]}>
            <Text style={styles.genderText}>{getGenderIcon(dog.gender)}</Text>
          </View>
        )}
      </View>

      {/* Dog Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.dogName}>{dog.name}</Text>
          <Text style={styles.dogBreed}>{dog.breed}</Text>
        </View>

        {showFullDetails ? (
          <View style={styles.detailsContainer}>
            {dog.birthday && (
              <View style={styles.detailRow}>
                <Calendar size={16} color={COLORS.primary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Birthday</Text>
                  <Text style={styles.detailValue}>
                    {formatBirthday(dog.birthday)} • {calculateAge(dog.birthday)}
                  </Text>
                </View>
              </View>
            )}

            {dog.weight && (
              <View style={styles.detailRow}>
                <Scale size={16} color={COLORS.secondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{dog.weight} kg</Text>
                </View>
              </View>
            )}

            {dog.bio && (
              <View style={styles.detailRow}>
                <Info size={16} color={COLORS.accent} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>About</Text>
                  <Text style={styles.bioText}>{dog.bio}</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            {dog.birthday && (
              <Text style={styles.ageText}>{calculateAge(dog.birthday)}</Text>
            )}
            {dog.weight && (
              <Text style={styles.weightText}>{dog.weight} kg</Text>
            )}
          </View>
        )}
      </View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  fullDetailsContainer: {
    padding: 20,
  },
  photoContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  dogPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  genderBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  genderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  infoContainer: {
    flex: 1,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dogName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  dogBreed: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.primary,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  ageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  bioText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    lineHeight: 22,
  },
});