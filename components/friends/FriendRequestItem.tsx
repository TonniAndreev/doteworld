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
  };
  onAccept: () => void;
  onDecline: () => void;
};

export default function FriendRequestItem({ request, onAccept, onDecline }: FriendRequestItemProps) {
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
          
          {/* Dog avatar overlapping with user avatar */}
          <View style={styles.dogAvatarContainer}>
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
  dogAvatarContainer: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 17, // Half of the dog avatar size
    overflow: 'hidden',
  },
  dogAvatar: {
    borderRadius: 17, // Half of the dog avatar size
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