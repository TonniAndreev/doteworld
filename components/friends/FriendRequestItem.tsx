import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

type FriendRequestItemProps = {
  request: {
    id: string;
    name: string;
    dogName: string;
    timestamp: string;
  };
  onAccept: () => void;
  onDecline: () => void;
};

export default function FriendRequestItem({ request, onAccept, onDecline }: FriendRequestItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{request.name.charAt(0)}</Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.name}>{request.name}</Text>
          <Text style={styles.dogName}>with {request.dogName}</Text>
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.primary,
  },
  details: {
    flex: 1,
  },
  name: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  dogName: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 2,
  },
  timestamp: {
    fontFamily: 'SF-Pro-Display-Regular',
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