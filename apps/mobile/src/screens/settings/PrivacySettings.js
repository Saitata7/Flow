// screens/settings/PrivacySettings.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import Button from '../../components/common/Button';

const PrivacySettings = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const { 
    settings, 
    loading, 
    error, 
    updating, 
    updateSettings 
  } = useSettings();

  const [privacyData, setPrivacyData] = useState({
    profileVisibility: 'private',
    shareStats: false,
    shareAchievements: false,
    allowFriendRequests: false,
    showOnlineStatus: false
  });

  // Initialize privacy data when settings load
  useEffect(() => {
    if (settings?.privacy) {
      setPrivacyData({
        profileVisibility: settings.privacy.profileVisibility || 'private',
        shareStats: settings.privacy.shareStats || false,
        shareAchievements: settings.privacy.shareAchievements || false,
        allowFriendRequests: settings.privacy.allowFriendRequests || false,
        showOnlineStatus: settings.privacy.showOnlineStatus || false
      });
    }
  }, [settings]);

  const handleToggleChange = (field, value) => {
    setPrivacyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVisibilityChange = (visibility) => {
    setPrivacyData(prev => ({
      ...prev,
      profileVisibility: visibility
    }));
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        privacy: privacyData
      });
      Alert.alert('Success', 'Privacy settings updated successfully!');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
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
    backButton: {
      padding: 8,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 16,
    },
    toggleItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    toggleLabel: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryText,
      flex: 1,
    },
    toggleDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginTop: 4,
    },
    visibilityOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    visibilityButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.progressBackground,
    },
    visibilityButtonActive: {
      backgroundColor: themeColors.primaryOrange,
      borderColor: themeColors.primaryOrange,
    },
    visibilityText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryText,
    },
    visibilityTextActive: {
      color: '#fff',
    },
    saveButton: {
      marginTop: 24,
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  if (loading && !settings) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.primaryText} 
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Visibility */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Profile Visibility</Text>
          
          <View style={dynamicStyles.visibilityOptions}>
            {[
              { key: 'private', label: 'Private' },
              { key: 'friends', label: 'Friends Only' },
              { key: 'public', label: 'Public' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => handleVisibilityChange(option.key)}
                style={[
                  dynamicStyles.visibilityButton,
                  privacyData.profileVisibility === option.key && dynamicStyles.visibilityButtonActive
                ]}
              >
                <Text
                  style={[
                    dynamicStyles.visibilityText,
                    privacyData.profileVisibility === option.key && dynamicStyles.visibilityTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sharing Preferences */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Sharing Preferences</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Share Statistics</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Allow others to see your progress and achievements
              </Text>
            </View>
            <Switch
              value={privacyData.shareStats}
              onValueChange={(value) => handleToggleChange('shareStats', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={privacyData.shareStats ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Share Achievements</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Share badges and milestones with the community
              </Text>
            </View>
            <Switch
              value={privacyData.shareAchievements}
              onValueChange={(value) => handleToggleChange('shareAchievements', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={privacyData.shareAchievements ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Social Features */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Social Features</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Allow Friend Requests</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Let other users send you friend requests
              </Text>
            </View>
            <Switch
              value={privacyData.allowFriendRequests}
              onValueChange={(value) => handleToggleChange('allowFriendRequests', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={privacyData.allowFriendRequests ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Show Online Status</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Display when you're active in the app
              </Text>
            </View>
            <Switch
              value={privacyData.showOnlineStatus}
              onValueChange={(value) => handleToggleChange('showOnlineStatus', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={privacyData.showOnlineStatus ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Save Button */}
        <Button
          title={updating ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          variant="primary"
          style={dynamicStyles.saveButton}
          disabled={updating}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySettings;
