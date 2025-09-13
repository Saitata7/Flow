// screens/profile/ProfileDashboard.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useProfile } from '../../hooks/useProfile';
import AvatarUploaderSimple from '../../components/profile/AvatarUploaderSimple';
import StatsSummary from '../../components/profile/StatsSummary';
import PublicPlansGrid from '../../components/profile/PublicPlansGrid';
import BadgeRow from '../../components/profile/BadgeRow';
import SocialLinks from '../../components/profile/SocialLinks';
import Button from '../../components/common/Button';
import SettingsMenu from '../settings/SettingsMenu';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const ProfileDashboard = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const { 
    profile, 
    loading, 
    error, 
    updating, 
    updateProfile, 
    updateStats,
    refetch 
  } = useProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Update stats when component mounts
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      await updateStats();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleShareProfile = () => {
    if (!profile?.visibility?.bio) {
      Alert.alert(
        'Profile Not Public',
        'Your profile is currently private. Enable public visibility in settings to share your profile.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowShareOptions(true);
  };

  const handlePlanPress = (plan) => {
    navigation.navigate('PlanDetail', { planId: plan.id });
  };

  const handleViewAllPlans = () => {
    navigation.navigate('PlansDashboard', { filter: 'public' });
  };

  const handleBadgePress = (badgeName, config) => {
    Alert.alert(
      badgeName,
      config.description,
      [{ text: 'OK' }]
    );
  };

  const handleSocialEdit = () => {
    navigation.navigate('EditProfile', { focus: 'social' });
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.progressBackground,
    },
    headerTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
    },
    settingsButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      padding: 16,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    nameContainer: {
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    displayName: {
      fontSize: typography.sizes.title1,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      textAlign: 'center',
    },
    bio: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: typography.sizes.body * 1.4,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      maxWidth: 120,
    },
    statsSection: {
      marginBottom: 16,
    },
    plansSection: {
      marginBottom: 16,
    },
    badgesSection: {
      marginBottom: 16,
    },
    socialSection: {
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: typography.sizes.body,
      color: themeColors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    emptyBio: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 8,
    }
  });

  if (loading && !profile) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>
            Failed to load profile: {error}
          </Text>
          <Button
            title="Retry"
            onPress={handleRefresh}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={dynamicStyles.settingsButton}
          onPress={handleSettings}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Ionicons 
            name="settings-outline" 
            size={24} 
            color={themeColors.primaryText} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.primaryOrange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={dynamicStyles.profileSection}>
          <AvatarUploaderSimple
            avatarUrl={profile?.avatarUrl}
            onAvatarChange={(url) => updateProfile({ avatarUrl: url })}
            size={120}
            editable={true}
          />
          
          <View style={dynamicStyles.nameContainer}>
            <Text style={dynamicStyles.displayName}>
              {profile?.displayName || 'Anonymous User'}
            </Text>
            {profile?.bio ? (
              <Text style={dynamicStyles.bio}>
                {profile.bio}
              </Text>
            ) : (
              <Text style={dynamicStyles.emptyBio}>
                No bio yet. Tap Edit Profile to add one!
              </Text>
            )}
          </View>

          <View style={dynamicStyles.actionButtons}>
            <Button
              title="Edit Profile"
              onPress={handleEditProfile}
              variant="secondary"
              style={dynamicStyles.actionButton}
            />
            <Button
              title="Share"
              onPress={handleShareProfile}
              variant="primary"
              style={dynamicStyles.actionButton}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={dynamicStyles.statsSection}>
          <StatsSummary
            stats={profile?.stats}
            onPress={() => navigation.navigate('Stats')}
            showLabels={true}
          />
        </View>

        {/* Public Plans Section */}
        <View style={dynamicStyles.plansSection}>
          <PublicPlansGrid
            plans={[]} // TODO: Load user's public plans
            onPlanPress={handlePlanPress}
            onViewAllPress={handleViewAllPlans}
            maxDisplay={3}
            showTitle={true}
          />
        </View>

        {/* Badges Section */}
        <View style={dynamicStyles.badgesSection}>
          <BadgeRow
            badges={profile?.stats?.badges || []}
            onBadgePress={handleBadgePress}
            showTitle={true}
            maxDisplay={6}
          />
        </View>

        {/* Social Links Section */}
        <View style={dynamicStyles.socialSection}>
          <SocialLinks
            social={profile?.social}
            onEdit={handleSocialEdit}
            editable={true}
            showTitle={true}
          />
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <SettingsMenu 
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </SafeAreaView>
  );
};

export default ProfileDashboard;
