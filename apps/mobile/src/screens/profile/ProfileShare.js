import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import { colors, typography, layout } from '../../../styles';

const ProfileShare = ({ navigation }) => {
  const handleShare = () => {
    // TODO: Implement actual sharing functionality
    console.log('Share profile functionality coming soon');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.shareCard}>
          <Icon name="person-circle-outline" size={80} color={colors.light.primaryOrange} />
          <Text style={styles.title}>Share Your Profile</Text>
          <Text style={styles.subtitle}>
            Share your progress and achievements with friends
          </Text>
        </View>

        <View style={styles.shareOptions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share-outline" size={24} color={colors.light.cardBackground} />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
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
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: layout.spacing.lg,
    justifyContent: 'center',
  },
  shareCard: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.xl,
    alignItems: 'center',
    marginBottom: layout.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    ...typography.styles.title1,
    color: colors.light.primaryText,
    marginTop: layout.spacing.md,
    marginBottom: layout.spacing.sm,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  shareOptions: {
    gap: layout.spacing.md,
  },
  shareButton: {
    backgroundColor: colors.light.primaryOrange,
    borderRadius: layout.borderRadius.lg,
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.spacing.sm,
  },
  shareButtonText: {
    ...typography.styles.body,
    color: colors.light.cardBackground,
    fontWeight: '600',
  },
});

export default ProfileShare;
