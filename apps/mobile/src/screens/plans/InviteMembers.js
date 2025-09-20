// src/screens/plans/InviteMembers.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import useAuth from '../../hooks/useAuth';

const InviteMembers = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [inviteMethod, setInviteMethod] = useState('link'); // 'link' or 'email'
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate invite link (in real app, this would come from backend)
  const generateInviteLink = () => {
    return `https://flowtracker.app/join/${groupId}`;
  };

  const handleShareLink = async () => {
    try {
      const inviteLink = generateInviteLink();
      await Share.share({
        message: `Join my Flow Tracker group! Use this link: ${inviteLink}`,
        url: inviteLink,
        title: 'Join Flow Tracker Group',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite link');
    }
  };

  const handleSendEmailInvite = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // In real app, this would send email via backend
      Alert.alert(
        'Invite Sent!',
        `Invitation sent to ${emailInput}`,
        [{ text: 'OK', onPress: () => setEmailInput('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = generateInviteLink();
    // In real app, this would copy to clipboard
    Alert.alert('Link Copied!', 'Invite link copied to clipboard');
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Members</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Invite Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Method</Text>
          
          <View style={styles.methodContainer}>
            <TouchableOpacity
              style={[
                styles.methodCard,
                inviteMethod === 'link' && styles.selectedMethodCard
              ]}
              onPress={() => setInviteMethod('link')}
            >
              <Icon
                name="link-outline"
                size={24}
                color={inviteMethod === 'link' ? colors.light.cardBackground : colors.light.primaryOrange}
              />
              <Text style={[
                styles.methodTitle,
                inviteMethod === 'link' && styles.selectedMethodTitle
              ]}>
                Share Link
              </Text>
              <Text style={[
                styles.methodDescription,
                inviteMethod === 'link' && styles.selectedMethodDescription
              ]}>
                Share invite link via any app
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodCard,
                inviteMethod === 'email' && styles.selectedMethodCard
              ]}
              onPress={() => setInviteMethod('email')}
            >
              <Icon
                name="mail-outline"
                size={24}
                color={inviteMethod === 'email' ? colors.light.cardBackground : colors.light.primaryOrange}
              />
              <Text style={[
                styles.methodTitle,
                inviteMethod === 'email' && styles.selectedMethodTitle
              ]}>
                Email Invite
              </Text>
              <Text style={[
                styles.methodDescription,
                inviteMethod === 'email' && styles.selectedMethodDescription
              ]}>
                Send direct email invitation
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invite Content */}
        {inviteMethod === 'link' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share Invite Link</Text>
            
            <View style={styles.linkContainer}>
              <View style={styles.linkBox}>
                <Text style={styles.linkText}>{generateInviteLink()}</Text>
              </View>
              
              <View style={styles.linkActions}>
                <Button
                  variant="secondary"
                  title="Copy Link"
                  onPress={copyInviteLink}
                  style={styles.linkButton}
                />
                <Button
                  variant="primary"
                  title="Share"
                  onPress={handleShareLink}
                  style={styles.linkButton}
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Icon name="information-circle-outline" size={20} color={colors.light.info} />
              <Text style={styles.infoText}>
                Anyone with this link can join your group. Share it via any messaging app or social media.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send Email Invitation</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email address"
                placeholderTextColor={colors.light.secondaryText}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Button
              variant="primary"
              title="Send Invitation"
              onPress={handleSendEmailInvite}
              loading={isLoading}
              style={styles.sendButton}
            />

            <View style={styles.infoBox}>
              <Icon name="information-circle-outline" size={20} color={colors.light.info} />
              <Text style={styles.infoText}>
                We'll send an invitation email with a link to join your group.
              </Text>
            </View>
          </View>
        )}

        {/* Group Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Group ID</Text>
              <Text style={styles.infoValue}>{groupId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invited by</Text>
              <Text style={styles.infoValue}>{user?.displayName || user?.email || 'You'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    padding: layout.spacing.sm,
  },
  headerTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
  },
  sectionTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
  },
  methodContainer: {
    gap: layout.spacing.md,
  },
  methodCard: {
    padding: layout.spacing.lg,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  selectedMethodCard: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  methodTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginTop: layout.spacing.sm,
  },
  selectedMethodTitle: {
    color: colors.light.cardBackground,
  },
  methodDescription: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    textAlign: 'center',
    marginTop: layout.spacing.xs,
  },
  selectedMethodDescription: {
    color: colors.light.cardBackground,
  },
  linkContainer: {
    gap: layout.spacing.md,
  },
  linkBox: {
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  linkText: {
    ...typography.styles.caption1,
    color: colors.light.primaryText,
    fontFamily: 'monospace',
  },
  linkActions: {
    flexDirection: 'row',
    gap: layout.spacing.md,
  },
  linkButton: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: layout.spacing.lg,
  },
  inputLabel: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '500',
    marginBottom: layout.spacing.sm,
  },
  textInput: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  sendButton: {
    marginBottom: layout.spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: layout.spacing.md,
    backgroundColor: colors.light.infoVariants.light,
    borderRadius: layout.borderRadius.md,
    gap: layout.spacing.sm,
  },
  infoText: {
    ...typography.styles.caption1,
    color: colors.light.info,
    flex: 1,
  },
  infoCard: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.lg,
    gap: layout.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  infoValue: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '500',
  },
});

export default InviteMembers;
