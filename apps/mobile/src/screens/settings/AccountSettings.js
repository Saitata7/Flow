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
import useAuth from '../../hooks/useAuth';
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

  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    dataPrivacy: {
      cloudBackup: false,
      localBackup: false,
      clinicianConsent: false
    },
    location: {
      enabled: false,
      shareLocation: false
    }
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        dataPrivacy: {
          cloudBackup: settings.dataPrivacy?.cloudBackup || false,
          localBackup: settings.dataPrivacy?.localBackup || false,
          clinicianConsent: settings.dataPrivacy?.clinicianConsent || false
        },
        location: {
          enabled: settings.location?.enabled || false,
          shareLocation: settings.location?.shareLocation || false
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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigate to auth screen after logout
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
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
    authSection: {
      marginTop: 8,
    },
    userInfo: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: themeColors.progressBackground,
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
      borderColor: themeColors.progressBackground,
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
      backgroundColor: themeColors.progressBackground,
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
          onPress={() => navigation.navigate('Home')}
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

          {/* Location Settings */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Location</Text>
            
            <View style={dynamicStyles.toggleItem}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.toggleLabel}>Enable Location</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  Allow the app to access your location for enhanced features
                </Text>
              </View>
              <Switch
                value={formData.location?.enabled || false}
                onValueChange={(value) => handleToggleChange('location', 'enabled', value)}
                trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                thumbColor={(formData.location?.enabled || false) ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={dynamicStyles.toggleItem}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.toggleLabel}>Share Location</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  Allow sharing your location with other users
                </Text>
              </View>
              <Switch
                value={formData.location?.shareLocation || false}
                onValueChange={(value) => handleToggleChange('location', 'shareLocation', value)}
                trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                thumbColor={(formData.location?.shareLocation || false) ? '#fff' : '#f4f3f4'}
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

          {/* Profile Information */}
          {user && (
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Profile Information</Text>
              
              <View style={dynamicStyles.profileCard}>
                <View style={dynamicStyles.profileHeader}>
                  <View style={dynamicStyles.avatarContainer}>
                    {user.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={dynamicStyles.avatar} />
                    ) : (
                      <View style={dynamicStyles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View style={dynamicStyles.profileInfo}>
                    <Text style={dynamicStyles.profileName}>{user.displayName || user.name || 'User'}</Text>
                    <Text style={dynamicStyles.profileEmail}>{user.email}</Text>
                    <Text style={dynamicStyles.profileUsername}>@{user.username || 'user'}</Text>
                  </View>
                </View>
                
                {user.bio && (
                  <View style={dynamicStyles.bioSection}>
                    <Text style={dynamicStyles.bioLabel}>Bio</Text>
                    <Text style={dynamicStyles.bioText}>{user.bio}</Text>
                  </View>
                )}
                
                <View style={dynamicStyles.statsSection}>
                  <Text style={dynamicStyles.statsLabel}>Stats</Text>
                  <View style={dynamicStyles.statsGrid}>
                    <View style={dynamicStyles.statItem}>
                      <Text style={dynamicStyles.statNumber}>{user.stats?.personalPlans || 0}</Text>
                      <Text style={dynamicStyles.statLabel}>Personal Plans</Text>
                    </View>
                    <View style={dynamicStyles.statItem}>
                      <Text style={dynamicStyles.statNumber}>{user.stats?.publicPlans || 0}</Text>
                      <Text style={dynamicStyles.statLabel}>Public Plans</Text>
                    </View>
                    <View style={dynamicStyles.statItem}>
                      <Text style={dynamicStyles.statNumber}>{user.stats?.followers || 0}</Text>
                      <Text style={dynamicStyles.statLabel}>Followers</Text>
                    </View>
                    <View style={dynamicStyles.statItem}>
                      <Text style={dynamicStyles.statNumber}>{user.stats?.following || 0}</Text>
                      <Text style={dynamicStyles.statLabel}>Following</Text>
                    </View>
                  </View>
                </View>
                
                <View style={dynamicStyles.joinDateSection}>
                  <Text style={dynamicStyles.joinDateLabel}>Member since</Text>
                  <Text style={dynamicStyles.joinDateText}>
                    {new Date(user.joinedAt || user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Authentication Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Authentication</Text>
            
            {user ? (
              <View style={dynamicStyles.authSection}>
                <Button
                  title="Sign Out"
                  onPress={handleSignOut}
                  variant="secondary"
                  style={dynamicStyles.signOutButton}
                />
              </View>
            ) : (
              <View style={dynamicStyles.authSection}>
                <Text style={dynamicStyles.authPrompt}>
                  Sign in to sync your data across devices and access premium features.
                </Text>
                <Button
                  title="Sign In"
                  onPress={() => navigation.navigate('Auth')}
                  variant="primary"
                  style={dynamicStyles.signInButton}
                />
              </View>
            )}
          </View>

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
    </SafeAreaWrapper>
  );
};

export default AccountSettings;
