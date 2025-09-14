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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import Button from '../../components/common/Button';

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

  const [formData, setFormData] = useState({
    profile: {
      name: '',
      email: '',
      timeZone: 'UTC',
      language: 'en'
    },
    dataPrivacy: {
      cloudBackup: false,
      localBackup: false,
      clinicianConsent: false
    }
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        profile: {
          name: settings.profile?.name || '',
          email: settings.profile?.email || '',
          timeZone: settings.profile?.timeZone || 'UTC',
          language: settings.profile?.language || 'en'
        },
        dataPrivacy: {
          cloudBackup: settings.dataPrivacy?.cloudBackup || false,
          localBackup: settings.dataPrivacy?.localBackup || false,
          clinicianConsent: settings.dataPrivacy?.clinicianConsent || false
        }
      });
    }
  }, [settings]);

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
    
    if (formData.profile.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }
    
    if (formData.profile.email && !isValidEmail(formData.profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? This will delete everything.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Yes, Delete', 
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement account deletion
                    Alert.alert('Coming Soon', 'Account deletion will be available in a future update.');
                  }
                }
              ]
            );
          }
        }
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
      borderColor: themeColors.progressBackground,
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
      borderColor: themeColors.progressBackground,
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
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Name</Text>
              <TextInput
                style={[
                  dynamicStyles.input,
                  errors.name && { borderColor: themeColors.error }
                ]}
                value={formData.profile.name}
                onChangeText={(text) => handleInputChange('profile', 'name', text)}
                placeholder="Enter your name"
                placeholderTextColor={themeColors.secondaryText}
                maxLength={50}
              />
              {errors.name && (
                <Text style={dynamicStyles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Email</Text>
              <TextInput
                style={[
                  dynamicStyles.input,
                  errors.email && { borderColor: themeColors.error }
                ]}
                value={formData.profile.email}
                onChangeText={(text) => handleInputChange('profile', 'email', text)}
                placeholder="Enter your email"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={dynamicStyles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Time Zone</Text>
              <TextInput
                style={dynamicStyles.input}
                value={formData.profile.timeZone}
                onChangeText={(text) => handleInputChange('profile', 'timeZone', text)}
                placeholder="e.g., UTC, EST, PST"
                placeholderTextColor={themeColors.secondaryText}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Language</Text>
              <View style={dynamicStyles.languageOptions}>
                {['en', 'es', 'fr'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => handleInputChange('profile', 'language', lang)}
                    style={[
                      dynamicStyles.languageButton,
                      formData.profile.language === lang && dynamicStyles.languageButtonActive
                    ]}
                  >
                    <Text
                      style={[
                        dynamicStyles.languageText,
                        formData.profile.language === lang && dynamicStyles.languageTextActive
                      ]}
                    >
                      {lang.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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

            <View style={dynamicStyles.toggleItem}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.toggleLabel}>Local Backup</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  Keep a local backup of your data
                </Text>
              </View>
              <Switch
                value={formData.dataPrivacy.localBackup}
                onValueChange={(value) => handleToggleChange('dataPrivacy', 'localBackup', value)}
                trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                thumbColor={formData.dataPrivacy.localBackup ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={dynamicStyles.toggleItem}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.toggleLabel}>Clinician Consent</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  Allow sharing data with healthcare providers
                </Text>
              </View>
              <Switch
                value={formData.dataPrivacy.clinicianConsent}
                onValueChange={(value) => handleToggleChange('dataPrivacy', 'clinicianConsent', value)}
                trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                thumbColor={formData.dataPrivacy.clinicianConsent ? '#fff' : '#f4f3f4'}
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

          {/* Danger Zone */}
          <View style={dynamicStyles.dangerSection}>
            <Text style={dynamicStyles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity
              style={dynamicStyles.dangerButton}
              onPress={handleDeleteAccount}
            >
              <Text style={dynamicStyles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AccountSettings;
