import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Calendar, Heart, Scale, Info, Users, Crown, UserPlus, Pencil } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { getDogAvatarSource } from '@/utils/dogAvatarUtils';
import { useDogOwnership } from '@/hooks/useDogOwnership';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';
import DogOwnershipManager from '@/components/dog/DogOwnershipManager';

interface Dog {
  id: string;
  name: string;
  breed: string;
  photo_url?: string;
  birthday?: string;
  bio?: string;
  weight?: number;
  gender?: 'male' | 'female';
  created_at: string;
}

interface DogOwner {
  profile_id: string;
  role: 'owner' | 'co-owner' | 'caretaker';
  permissions: {
    edit: boolean;
    share: boolean;
    delete: boolean;
  };
  ownership_since: string;
  invited_by?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface DogProfileCardProps {
  dog: Dog;
  onPress?: () => void;
  showFullDetails?: boolean;
}

export default function DogProfileCard({ dog, onPress, showFullDetails = false }: DogProfileCardProps) {
  const [owners, setOwners] = useState<DogOwner[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  
  const { user } = useAuth();
  const { getDogOwners } = useDogOwnership();

  useEffect(() => {
    if (showFullDetails) {
      loadOwners();
    }
  }, [dog.id, showFullDetails]);

  const loadOwners = async () => {
    setIsLoadingOwners(true);
    try {
      console.log('Loading owners for dog:', dog.id);
      const ownersData = await getDogOwners(dog.id);
      console.log('Owners data loaded:', ownersData);
      setOwners(ownersData);
    } catch (error) {
      console.error('Error loading owners:', error);
    } finally {
      setIsLoadingOwners(false);
    }
  };

  const canInviteOwners = () => {
    if (!user) return false;
    const currentUserOwnership = owners.find(o => o.profile_id === user.id);
    return currentUserOwnership?.permissions?.share === true;
  };

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
        return null;
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

  // Sort owners to ensure Alpha is always first
  const sortedOwners = [...owners].sort((a, b) => {
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    return 0;
  });

  return (
    <CardComponent 
      style={[styles.container, showFullDetails && styles.fullDetailsContainer]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Dog Photo */}
      <View style={styles.photoContainer}>
        <Image 
          source={getDogAvatarSource(dog.id, dog.photo_url, dog.breed)}
          style={styles.dogPhoto}
          resizeMode="cover"
        />
        
        {dog.gender && getGenderIcon(dog.gender) && (
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

            {/* Owners Section */}
            <View style={styles.ownersSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.ownersHeaderLeft}>
                  <Users size={16} color={COLORS.neutralDark} />
                  <Text style={styles.ownersTitle}>
                    Owners ({owners.length})
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => setShowOwnershipModal(true)}
                >
                  <UserPlus size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {isLoadingOwners ? (
                <View style={styles.loadingOwners}>
                  <Text style={styles.loadingText}>Loading owners...</Text>
                </View>
              ) : (
                <View style={styles.ownersList}>
                  {sortedOwners.map((owner) => (
                    <View key={owner.profile_id} style={styles.ownerItem}>
                      <UserAvatar
                        userId={owner.profile_id}
                        photoURL={owner.avatar_url}
                        userName={`${owner.first_name} ${owner.last_name}`}
                        size={40}
                        style={styles.ownerAvatar}
                        containerStyle={styles.ownerAvatarContainer}
                      />
                      
                      <View style={styles.ownerInfo}>
                        <Text style={[
                          styles.ownerName,
                          owner.role === 'owner' && { color: COLORS.accent }
                        ]} numberOfLines={1}>
                          {owner.role === 'owner' ? (
                            <>
                              <Text style={{ color: COLORS.accent }}>👑 </Text>
                              {`${owner.first_name || ''} ${owner.last_name || ''}`.trim()}
                            </>
                          ) : (
                            `${owner.first_name || ''} ${owner.last_name || ''}`.trim()
                          )}
                        </Text>
                        
                        <Text style={[
                          styles.roleText,
                          owner.role === 'owner' ? styles.alphaRoleText : styles.regularRoleText
                        ]}>
                          {owner.role === 'owner' ? 'Alpha Owner' : 'Owner'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
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

      {/* Dog Ownership Manager Modal */}
      <DogOwnershipManager
        dogId={dog.id}
        dogName={dog.name}
        visible={showOwnershipModal}
        onClose={() => {
          setShowOwnershipModal(false);
          loadOwners(); // Refresh owners when modal closes
        }}
      />
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
  
  // Owners Section Styles
  ownersSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownersTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  manageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOwners: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  ownersList: {
    gap: 8,
  },
  ownerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownerAvatarContainer: {
    backgroundColor: '#F0F0F0',
  },
  ownerAvatar: {
    marginRight: 12,
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  ownerName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  alphaRoleText: {
    color: COLORS.accent,
  },
  regularRoleText: {
    color: COLORS.neutralDark,
  },
});