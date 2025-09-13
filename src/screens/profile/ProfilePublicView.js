// screens/profile/ProfilePublicView.js
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
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { usePublicProfile } from '../../hooks/useProfile';
import AvatarUploaderSimple from '../../components/profile/AvatarUploaderSimple';
import StatsSummary from '../../components/profile/StatsSummary';
import PublicPlansGrid from '../../components/profile/PublicPlansGrid';
import BadgeRow from '../../components/profile/BadgeRow';
import SocialLinks from '../../components/profile/SocialLinks';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const ProfilePublicView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const { userId } = route.params || {};
  const { 
    publicProfile, 
    loading, 
    error, 
    refetch 
  } = usePublicProfile(userId);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://flowapp.com/profile/${userId}`; // TODO: Replace with actual URL
      await Share.share({
        message: `Check out ${publicProfile?.displayName}'s Flow profile: ${shareUrl}`,
        url: shareUrl,
        title: `${publicProfile?.displayName}'s Profile`
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
      Alert.alert('Error', 'Failed to share profile');
    }
  };

  const handlePlanPress = (plan) => {
    navigation.navigate('PlanDetail', { planId: plan.id });
  };

  const handleBadgePress = (badgeName, config) => {
    Alert.alert(
      badgeName,
      config.description,
      [{ text: 'OK' }]
    );
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
    shareButton: {
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
    shareButtonSection: {
      alignItems: 'center',
      marginTop: 16,
    },
    shareButtonText: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.semibold,
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
    notFoundContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    notFoundIcon: {
      marginBottom: 16,
    },
    notFoundTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 8,
      textAlign: 'center',
    },
    notFoundText: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      textAlign: 'center',
      lineHeight: typography.sizes.body * 1.4,
    },
    privateProfileContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    privateIcon: {
      marginBottom: 16,
    },
    privateTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 8,
      textAlign: 'center',
    },
    privateText: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      textAlign: 'center',
      lineHeight: typography.sizes.body * 1.4,
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Ionicons 
            name="alert-circle-outline" 
            size={48} 
            color={themeColors.error}
            style={dynamicStyles.notFoundIcon}
          />
          <Text style={dynamicStyles.errorText}>
            Failed to load profile: {error}
          </Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={dynamicStyles.shareButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!publicProfile) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.notFoundContainer}>
          <Ionicons 
            name="person-outline" 
            size={64} 
            color={themeColors.secondaryText}
            style={dynamicStyles.notFoundIcon}
          />
          <Text style={dynamicStyles.notFoundTitle}>Profile Not Found</Text>
          <Text style={dynamicStyles.notFoundText}>
            This profile doesn't exist or has been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if profile is private
  if (!publicProfile.visibility?.bio && !publicProfile.visibility?.stats && !publicProfile.visibility?.plans) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.privateProfileContainer}>
          <Ionicons 
            name="lock-closed-outline" 
            size={64} 
            color={themeColors.secondaryText}
            style={dynamicStyles.privateIcon}
          />
          <Text style={dynamicStyles.privateTitle}>Private Profile</Text>
          <Text style={dynamicStyles.privateText}>
            This profile is private and not available for public viewing.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={{ padding: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.primaryText} 
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={dynamicStyles.shareButton}
          onPress={handleShare}
          accessibilityLabel="Share profile"
          accessibilityRole="button"
        >
          <Ionicons 
            name="share-outline" 
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
            avatarUrl={publicProfile?.avatarUrl}
            size={120}
            editable={false}
          />
          
          <View style={dynamicStyles.nameContainer}>
            <Text style={dynamicStyles.displayName}>
              {publicProfile?.displayName || 'Anonymous User'}
            </Text>
            {publicProfile?.bio && publicProfile?.visibility?.bio && (
              <Text style={dynamicStyles.bio}>
                {publicProfile.bio}
              </Text>
            )}
          </View>

          <View style={dynamicStyles.shareButtonSection}>
            <TouchableOpacity onPress={handleShare}>
              <Text style={dynamicStyles.shareButtonText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        {publicProfile?.visibility?.stats && (
          <View style={dynamicStyles.statsSection}>
            <StatsSummary
              stats={publicProfile?.stats}
              showLabels={true}
              compact={false}
            />
          </View>
        )}

        {/* Public Plans Section */}
        {publicProfile?.visibility?.plans && (
          <View style={dynamicStyles.plansSection}>
            <PublicPlansGrid
              plans={[]} // TODO: Load user's public plans
              onPlanPress={handlePlanPress}
              maxDisplay={3}
              showTitle={true}
            />
          </View>
        )}

        {/* Badges Section */}
        {publicProfile?.visibility?.stats && publicProfile?.stats?.badges?.length > 0 && (
          <View style={dynamicStyles.badgesSection}>
            <BadgeRow
              badges={publicProfile?.stats?.badges}
              onBadgePress={handleBadgePress}
              showTitle={true}
              maxDisplay={6}
            />
          </View>
        )}

        {/* Social Links Section */}
        <View style={dynamicStyles.socialSection}>
          <SocialLinks
            social={publicProfile?.social}
            editable={false}
            showTitle={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfilePublicView;
