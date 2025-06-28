import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import UserAvatar from '@/components/common/UserAvatar';

type FriendRequestItemProps = {
  request: {
    id: string;
    senderId: string;
    senderName: string;
    senderDogName: string;
    senderPhotoURL?: string | null;
    timestamp: string;
    senderDogs?: Array<{
      id: string;
      name: string;
      breed?: string;
      photo_url?: string | null;
    }>;
  };
  onAccept: () => void;
  onDecline: () => void;
};

export default function FriendRequestItem({ request, onAccept, onDecline }: FriendRequestItemProps) {
  // Determine if we have dogs and how many
  const hasDogs = request.senderDogs && request.senderDogs.length > 0;
  const dogCount = request.senderDogs?.length || 0;
  
  // Format dog names as comma-separated list
  const getDogNames = () => {
    if (!hasDogs) return request.senderDogName || 'No dog';
    
    const names = request.senderDogs.map(dog => dog.name);
    return names.join(', ');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <UserAvatar
            userId={request.senderId}
            photoURL={request.senderPhotoURL}
            userName={request.senderName}
            size={50}
            style={styles.userAvatar}
          />
          
          {/* Dog avatars - different display based on number of dogs */}
          {hasDogs && (
            <View style={styles.dogAvatarsContainer}>
              {/* First dog avatar - always shown if there's at least one dog */}
              {dogCount >= 1 && (
                <View style={[styles.dogAvatarWrapper, styles.firstDogAvatar]}>
                  <UserAvatar
                    userId={`dog-${request.senderDogs[0].id}`}
                    photoURL={request.senderDogs[0].photo_url}
                    userName={request.senderDogs[0].name}
                    size={28}
                    isDogAvatar={true}
                    dogBreed={request.senderDogs[0].breed}
                    style={styles.dogAvatar}
                  />
                </View>
              )}
              
              {/* Second dog avatar - shown if there are at least 2 dogs */}
              {dogCount >= 2 && (
                <View style={[styles.dogAvatarWrapper, styles.secondDogAvatar]}>
                  <UserAvatar
                    userId={`dog-${request.senderDogs[1].id}`}
                    photoURL={request.senderDogs[1].photo_url}
                    userName={request.senderDogs[1].name}
                    size={28}
                    isDogAvatar={true}
                    dogBreed={request.senderDogs[1].breed}
                    style={styles.dogAvatar}
                  />
                </View>
              )}
              
              {/* "+X" indicator for 3 or more dogs */}
              {dogCount > 2 && (
                <View style={styles.moreDogsBadge}>
                  <Text style={styles.moreDogsBadgeText}>+{dogCount - 2}</Text>
                </View>
              )}
            </View>
          )}
          
          {/* Fallback for when we don't have the dogs array but have a dog name */}
          {!hasDogs && request.senderDogName && request.senderDogName !== 'No dog' && (
            <View style={styles.dogAvatarsContainer}>
              <View style={[styles.dogAvatarWrapper, styles.firstDogAvatar]}>
                <UserAvatar
                  userId={`dog-${request.senderId}`}
                  photoURL={null}
                  userName={request.senderDogName}
                  size={28}
                  isDogAvatar={true}
                  style={styles.dogAvatar}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.name}>{request.senderName}</Text>
          <Text style={styles.dogName} numberOfLines={1}>{getDogNames()}</Text>
          <Text style={styles.timestamp}>
            {new Date(request.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={onAccept}
        >
          <Check size={20} color={COLORS.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]}
          onPress={onDecline}
        >
          <X size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryExtraLight,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
    width: 50,
    height: 50,
  },
  userAvatar: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  dogAvatarsContainer: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    flexDirection: 'row',
  },
  dogAvatarWrapper: {
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: -10, // Negative margin for overlapping effect
  },
  firstDogAvatar: {
    zIndex: 2,
  },
  secondDogAvatar: {
    zIndex: 1,
  },
  dogAvatar: {
    borderRadius: 14,
  },
  moreDogsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    marginLeft: -10, // Negative margin for overlapping effect
  },
  moreDogsBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.white,
  },
  details: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  dogName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 2,
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
});