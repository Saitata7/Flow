// screens/settings/AccountSettings.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../context/JWTAuthContext';
import Button from '../../components/common/Button';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const AccountSettings = () => {
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

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    profile: {
      email: '',
      phoneNumber: ''
    },
    dataPrivacy: {
      cloudBackup: false
    },
    timezone: {
      autoTimezone: true,
      manualTimezone: 'UTC'
    }
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        profile: {
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || ''
        },
        dataPrivacy: {
          cloudBackup: settings.dataPrivacy?.cloudBackup || false
        },
        timezone: {
          autoTimezone: settings.timezone?.autoTimezone !== false, // Default to true
          manualTimezone: settings.timezone?.manualTimezone || 'UTC'
        }
      });
    }
  }, [settings, user]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleToggleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email is read-only, no validation needed
    
    // Phone number is optional, no validation needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      await updateSettings(formData);
      Alert.alert('Success', 'Account settings updated successfully!');
    } catch (error) {
      console.error('Error saving account settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'This will deactivate your account and remove all your data. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement account deactivation
              Alert.alert('Account Deactivated', 'Your account has been deactivated successfully.');
            } catch (error) {
              console.error('Failed to deactivate account:', error);
              Alert.alert('Error', 'Failed to deactivate account');
            }
          },
        },
      ]
    );
  };

  const handleResetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all habits, settings, and account data. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all settings data
              await updateSettings({
                dataPrivacy: { cloudBackup: false },
                timezone: { autoTimezone: true, manualTimezone: 'UTC' }
              });
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              console.error('Failed to reset data:', error);
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
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
      borderBottomColor: themeColors.border,
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
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: typography.sizes.body,
      color: themeColors.primaryText,
      backgroundColor: themeColors.background,
    },
    errorText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.error,
      marginTop: 4,
    },
    enhancedProfileButton: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    enhancedProfileContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    enhancedProfileText: {
      flex: 1,
    },
    enhancedProfileTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primaryText,
      marginBottom: 4,
    },
    enhancedProfileSubtitle: {
      fontSize: 14,
      color: themeColors.secondaryText,
      lineHeight: 20,
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
    languageOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    languageButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    languageButtonActive: {
      backgroundColor: themeColors.primaryOrange,
      borderColor: themeColors.primaryOrange,
    },
    languageText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryText,
    },
    languageTextActive: {
      color: '#fff',
    },
    saveButton: {
      marginTop: 24,
      marginBottom: 16,
    },
    dangerSection: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.error,
    },
    dangerTitle: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.error,
      marginBottom: 16,
    },
    dangerButton: {
      backgroundColor: themeColors.error,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    dangerButtonText: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: '#fff',
    },
    authSection: {
      marginTop: 8,
    },
    userInfo: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 8,
    },
    userName: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
    },
    authPrompt: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      marginBottom: 16,
      lineHeight: 20,
    },
    signOutButton: {
      marginTop: 8,
    },
    signInButton: {
      marginTop: 8,
    },
    profileCard: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarContainer: {
      marginRight: 16,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: themeColors.primaryOrange,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      marginBottom: 2,
    },
    profileUsername: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.medium,
    },
    bioSection: {
      marginBottom: 16,
    },
    bioLabel: {
      fontSize: typography.sizes.caption1,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    bioText: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      lineHeight: 20,
    },
    statsSection: {
      marginBottom: 16,
    },
    statsLabel: {
      fontSize: typography.sizes.caption1,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      backgroundColor: themeColors.surface,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    statNumber: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryOrange,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      textAlign: 'center',
    },
    joinDateSection: {
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.progressBackground,
    },
    joinDateLabel: {
      fontSize: typography.sizes.caption1,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    joinDateText: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  if (loading && !settings) {
    return (
      <SafeAreaWrapper style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper style={dynamicStyles.container}>
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
        <Text style={dynamicStyles.headerTitle}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={dynamicStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={dynamicStyles.container}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Information */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Profile Information</Text>
            
            {/* Enhanced Profile Link */}
            <TouchableOpacity
              style={dynamicStyles.enhancedProfileButton}
              onPress={() => navigation.navigate('EnhancedProfileSettings')}
            >
              <View style={dynamicStyles.enhancedProfileContent}>
                <View style={dynamicStyles.enhancedProfileText}>
                  <Text style={dynamicStyles.enhancedProfileTitle}>Complete Your Profile</Text>
                  <Text style={dynamicStyles.enhancedProfileSubtitle}>
                    Add personal information, demographics, and privacy preferences
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeColors.secondaryText} />
              </View>
            </TouchableOpacity>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Email Address</Text>
              <TextInput
                style={[dynamicStyles.input, { backgroundColor: themeColors.surface, color: themeColors.secondaryText }]}
                value={formData.profile.email}
                placeholder="Email address"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={false}
              />
              <Text style={[dynamicStyles.errorText, { color: themeColors.secondaryText, fontSize: 12 }]}>
                Email address cannot be changed
              </Text>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={[dynamicStyles.input, errors.phoneNumber && { borderColor: themeColors.error }]}
                value={formData.profile.phoneNumber}
                onChangeText={(value) => handleInputChange('profile', 'phoneNumber', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
              {errors.phoneNumber && <Text style={dynamicStyles.errorText}>{errors.phoneNumber}</Text>}
            </View>
          </View>

          {/* Data Privacy */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Data Privacy</Text>
            
            <View style={dynamicStyles.toggleItem}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.toggleLabel}>Cloud Backup</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  Automatically backup your data to the cloud
                </Text>
              </View>
              <Switch
                value={formData.dataPrivacy.cloudBackup}
                onValueChange={(value) => handleToggleChange('dataPrivacy', 'cloudBackup', value)}
                trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                thumbColor={formData.dataPrivacy.cloudBackup ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Time Zone Settings */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Time Zone</Text>
            
            <View style={dynamicStyles.toggleItem}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.toggleLabel}>Auto Time Zone</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  Automatically detect and use your device's time zone
                </Text>
              </View>
              <Switch
                value={formData.timezone.autoTimezone}
                onValueChange={(value) => handleToggleChange('timezone', 'autoTimezone', value)}
                trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                thumbColor={formData.timezone.autoTimezone ? '#fff' : '#f4f3f4'}
              />
            </View>

            {!formData.timezone.autoTimezone && (
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Manual Time Zone</Text>
                <TextInput
                  style={[dynamicStyles.input, errors.manualTimezone && { borderColor: themeColors.error }]}
                  value={formData.timezone.manualTimezone}
                  onChangeText={(value) => handleInputChange('timezone', 'manualTimezone', value)}
                  placeholder="e.g., UTC, EST, PST"
                  placeholderTextColor={themeColors.secondaryText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {errors.manualTimezone && <Text style={dynamicStyles.errorText}>{errors.manualTimezone}</Text>}
              </View>
            )}
          </View>

          {/* Save Button */}
          <Button
            title={updating ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            variant="primary"
            style={dynamicStyles.saveButton}
            disabled={updating}
          />


          {/* Danger Zone */}
          <View style={dynamicStyles.dangerSection}>
            <Text style={dynamicStyles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity
              style={dynamicStyles.dangerButton}
              onPress={handleDeactivateAccount}
            >
              <Text style={dynamicStyles.dangerButtonText}>Deactivate Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.dangerButton, { marginTop: 12 }]}
              onPress={handleResetAllData}
            >
              <Text style={dynamicStyles.dangerButtonText}>Reset All Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

export default AccountSettings;
