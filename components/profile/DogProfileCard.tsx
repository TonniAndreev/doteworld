import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Calendar, Heart, Scale, Info, Users, Crown, Shield, Eye, UserPlus, UserX, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { getDogAvatarSource } from '@/utils/dogAvatarUtils';
import { useDogOwnership } from '@/hooks/useDogOwnership';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';
import DogOwnershipManager from '@/components/dog/DogOwnershipManager';
import DogInviteModal from '@/components/dog/DogInviteModal';

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
    delete: boolean;
    share: boolean;
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAllOwners, setShowAllOwners] = useState(false);
  
  const { user } = useAuth();
  const { getDogOwners, removeCoOwner } = useDogOwnership();

  useEffect(() => {
    if (showFullDetails) {
      loadOwners();
    }
  }, [dog.id, showFullDetails]);

  const loadOwners = async () => {
    setIsLoadingOwners(true);
    try {
      const ownersData = await getDogOwners(dog.id);
      setOwners(ownersData);
    } catch (error) {
      console.error('Error loading owners:', error);
    } finally {
      setIsLoadingOwners(false);
    }
  };

  const handleRemoveOwner = async (profileId: string, ownerName: string) => {
    Alert.alert(
      'Remove Co-Owner',
      `Are you sure you want to remove ${ownerName} as a co-owner of ${dog.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeCoOwner(dog.id, profileId);
            if (result.success) {
              Alert.alert('Success', 'Co-owner removed successfully');
              loadOwners();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove co-owner');
            }
          },
        },
      ]
    );
  };

  const canRemoveOwner = (owner: DogOwner) => {
    if (!user) return false;
    
    // Can't remove yourself
    if (owner.profile_id === user.id) return false;
    
    // Can't remove the original owner
    if (owner.role === 'owner') return false;
    
    // Check if current user has share permissions
    const currentUserOwnership = owners.find(o => o.profile_id === user.id);
    return currentUserOwnership?.permissions?.share === true;
  };

  const canInviteOwners = () => {
    if (!user) return false;
    const currentUserOwnership = owners.find(o => o.profile_id === user.id);
    return currentUserOwnership?.permissions?.share === true;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={14} color={COLORS.accent} />;
      case 'co-owner':
        return <Shield size={14} color={COLORS.primary} />;
      case 'caretaker':
        return <Eye size={14} color={COLORS.secondary} />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return COLORS.accent;
      case 'co-owner':
        return COLORS.primary;
      case 'caretaker':
        return COLORS.secondary;
      default:
        return COLORS.neutralMedium;
    }
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

  const displayedOwners = showAllOwners ? owners : owners.slice(0, 3);
  const hasMoreOwners = owners.length > 3;

  const CardComponent = onPress ? TouchableOpacity : View;

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
              <View style={styles.ownersSectionHeader}>
                <View style={styles.ownersHeaderLeft}>
                  <Users size={16} color={COLORS.neutralDark} />
                  <Text style={styles.ownersTitle}>
                    Owners ({owners.length})
                  </Text>
                </View>
                
                <View style={styles.ownersActions}>
                  {canInviteOwners() && (
                    <TouchableOpacity
                      style={styles.addOwnerButton}
                      onPress={() => setShowInviteModal(true)}
                    >
                      <UserPlus size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => setShowOwnershipModal(true)}
                  >
                    <MoreHorizontal size={14} color={COLORS.neutralMedium} />
                  </TouchableOpacity>
                </View>
              </View>

              {isLoadingOwners ? (
                <View style={styles.loadingOwners}>
                  <Text style={styles.loadingText}>Loading owners...</Text>
                </View>
              ) : (
                <View style={styles.ownersList}>
                  {displayedOwners.map((owner) => (
                    <View key={owner.profile_id} style={styles.ownerItem}>
                      <UserAvatar
                        userId={owner.profile_id}
                        photoURL={owner.avatar_url}
                        userName={`${owner.first_name} ${owner.last_name}`}
                        size={32}
                        style={styles.ownerAvatar}
                      />
                      
                      <View style={styles.ownerInfo}>
                        <Text style={styles.ownerName} numberOfLines={1}>
                          {`${owner.first_name} ${owner.last_name}`.trim()}
                        </Text>
                        
                        <View style={styles.ownerRole}>
                          {getRoleIcon(owner.role)}
                          <Text style={[styles.roleText, { color: getRoleColor(owner.role) }]}>
                            {owner.role.charAt(0).toUpperCase() + owner.role.slice(1)}
                          </Text>
                        </View>
                      </View>
                      
                      {canRemoveOwner(owner) && (
                        <TouchableOpacity
                          style={styles.removeOwnerButton}
                          onPress={() => handleRemoveOwner(
                            owner.profile_id, 
                            `${owner.first_name} ${owner.last_name}`
                          )}
                        >
                          <UserX size={12} color={COLORS.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  
                  {hasMoreOwners && !showAllOwners && (
                    <TouchableOpacity
                      style={styles.showMoreButton}
                      onPress={() => setShowAllOwners(true)}
                    >
                      <Text style={styles.showMoreText}>Show All Owners</Text>
                    </TouchableOpacity>
                  )}
                  
                  {hasMoreOwners && showAllOwners && (
                    <TouchableOpacity
                      style={styles.showLessButton}
                      onPress={() => setShowAllOwners(false)}
                    >
                      <Text style={styles.showLessText}>Show Less</Text>
                    </TouchableOpacity>
                  )}
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

      {/* Dog Invite Modal */}
      <DogInviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        dogId={dog.id}
        dogName={dog.name}
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
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  ownersSectionHeader: {
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
  ownersActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addOwnerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  ownerAvatar: {
    marginRight: 12,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  ownerRole: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  removeOwnerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 4,
  },
  showMoreText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.primary,
  },
  showLessButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  showLessText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.primary,
  },
});