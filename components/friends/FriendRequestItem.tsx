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
                    size={34}
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
                    size={34}
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
                  size={34}
                  isDogAvatar={true}
                  style={styles.dogAvatar}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.name}>{request.senderName}</Text>
          <Text style={styles.dogName}>with {request.senderDogName}</Text>
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
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
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
    marginRight: 20, // Increased spacing between avatar and text
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
  },
  dogAvatarWrapper: {
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 17, // Half of the dog avatar size
    overflow: 'hidden',
    position: 'absolute',
  },
  firstDogAvatar: {
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  secondDogAvatar: {
    bottom: 10,
    left: 10,
    zIndex: 1,
  },
  dogAvatar: {
    borderRadius: 17, // Half of the dog avatar size
  },
  moreDogsBadge: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
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
    fontFamily: 'Inter-Medium',
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
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
});