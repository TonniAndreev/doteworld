import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { X, Mail, Link, Copy, Send, Shield, Eye } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useDogOwnership } from '@/hooks/useDogOwnership';

interface DogInviteModalProps {
  visible: boolean;
  onClose: () => void;
  dogId: string;
  dogName: string;
}

export default function DogInviteModal({ visible, onClose, dogId, dogName }: DogInviteModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'co-owner' | 'caretaker'>('co-owner');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const { inviteCoOwner } = useDogOwnership();

  const generateInviteLink = () => {
    // Create a deep link that includes the dog ID and invite token
    const inviteToken = `${dogId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = 'https://dote.app'; // Replace with your actual domain
    const link = `${baseUrl}/invite/${inviteToken}?dogId=${dogId}&dogName=${encodeURIComponent(dogName)}&role=${inviteRole}`;
    setInviteLink(link);
    return link;
  };

  const handleEmailInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await inviteCoOwner(dogId, inviteEmail.trim(), inviteRole, inviteMessage.trim());
      
      if (result.success) {
        Alert.alert('Success', 'Invitation sent successfully!');
        setInviteEmail('');
        setInviteMessage('');
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const link = generateInviteLink();
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert('Success', 'Invite link copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShareLink = async () => {
    const link = generateInviteLink();
    const message = `Hi! I'd like to invite you to be a ${inviteRole} of my dog ${dogName} on Dote. Click this link to join: ${link}`;
    
    try {
      await Share.share({
        message,
        url: link,
        title: `Invite to co-own ${dogName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'co-owner':
        return <Shield size={20} color={COLORS.primary} />;
      case 'caretaker':
        return <Eye size={20} color={COLORS.secondary} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Co-Owner</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.neutralDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Invite someone to help care for {dogName}
          </Text>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'email' && styles.activeTab]}
              onPress={() => setActiveTab('email')}
            >
              <Mail size={20} color={activeTab === 'email' ? COLORS.primary : COLORS.neutralMedium} />
              <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>
                Email Invite
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'link' && styles.activeTab]}
              onPress={() => setActiveTab('link')}
            >
              <Link size={20} color={activeTab === 'link' ? COLORS.primary : COLORS.neutralMedium} />
              <Text style={[styles.tabText, activeTab === 'link' && styles.activeTabText]}>
                Share Link
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Role Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleOption, inviteRole === 'co-owner' && styles.selectedRoleOption]}
                  onPress={() => setInviteRole('co-owner')}
                >
                  <Shield size={20} color={inviteRole === 'co-owner' ? COLORS.white : COLORS.primary} />
                  <Text style={[styles.roleOptionText, inviteRole === 'co-owner' && styles.selectedRoleOptionText]}>
                    Co-Owner
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleOption, inviteRole === 'caretaker' && styles.selectedRoleOption]}
                  onPress={() => setInviteRole('caretaker')}
                >
                  <Eye size={20} color={inviteRole === 'caretaker' ? COLORS.white : COLORS.secondary} />
                  <Text style={[styles.roleOptionText, inviteRole === 'caretaker' && styles.selectedRoleOptionText]}>
                    Caretaker
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeTab === 'email' ? (
              <>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWithIcon}>
                    <Mail size={20} color={COLORS.neutralMedium} />
                    <TextInput
                      style={styles.textInput}
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="Enter email address"
                      placeholderTextColor={COLORS.neutralMedium}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Message Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Personal Message (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.messageInput]}
                    value={inviteMessage}
                    onChangeText={setInviteMessage}
                    placeholder="Add a personal message..."
                    placeholderTextColor={COLORS.neutralMedium}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Send Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEmailInvite}
                  disabled={isLoading || !inviteEmail.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Send size={20} color={COLORS.white} />
                      <Text style={styles.primaryButtonText}>Send Invitation</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Link Sharing Options */}
                <View style={styles.linkSection}>
                  <Text style={styles.linkDescription}>
                    Share this link with someone to invite them as a {inviteRole} of {dogName}. 
                    They'll be able to register and automatically get access.
                  </Text>

                  <View style={styles.linkActions}>
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={handleCopyLink}
                    >
                      <Copy size={20} color={COLORS.primary} />
                      <Text style={styles.linkButtonText}>Copy Link</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={handleShareLink}
                    >
                      <Send size={20} color={COLORS.primary} />
                      <Text style={styles.linkButtonText}>Share Link</Text>
                    </TouchableOpacity>
                  </View>

                  {inviteLink && (
                    <View style={styles.linkPreview}>
                      <Text style={styles.linkPreviewLabel}>Preview:</Text>
                      <Text style={styles.linkPreviewText} numberOfLines={2}>
                        {inviteLink}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Role Explanation */}
            <View style={styles.roleExplanation}>
              <Text style={styles.explanationTitle}>Role Permissions:</Text>
              <View style={styles.explanationItem}>
                <Shield size={16} color={COLORS.primary} />
                <Text style={styles.explanationText}>
                  <Text style={styles.boldText}>Co-Owner:</Text> Can edit dog info and invite others
                </Text>
              </View>
              <View style={styles.explanationItem}>
                <Eye size={16} color={COLORS.secondary} />
                <Text style={styles.explanationText}>
                  <Text style={styles.boldText}>Caretaker:</Text> Can view dog info only
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    padding: 20,
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginLeft: 12,
  },
  messageInput: {
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.neutralLight,
    gap: 8,
  },
  selectedRoleOption: {
    backgroundColor: COLORS.primary,
  },
  roleOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  selectedRoleOptionText: {
    color: COLORS.white,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  linkSection: {
    marginBottom: 20,
  },
  linkDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    lineHeight: 20,
    marginBottom: 20,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  linkButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  linkPreview: {
    backgroundColor: COLORS.neutralExtraLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  linkPreviewLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginBottom: 4,
  },
  linkPreviewText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralDark,
  },
  roleExplanation: {
    backgroundColor: COLORS.neutralExtraLight,
    padding: 16,
    borderRadius: 12,
  },
  explanationTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  explanationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  explanationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    flex: 1,
  },
  boldText: {
    fontFamily: 'Inter-Bold',
    color: COLORS.neutralDark,
  },
});