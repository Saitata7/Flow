// screens/profile/EditProfile.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useProfile } from '../../hooks/useProfile';
import AvatarUploaderSimple from '../../components/profile/AvatarUploaderSimple';
import Button from '../../components/common/Button';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const EditProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const { 
    profile, 
    loading, 
    error, 
    updating, 
    updateProfile, 
    updateDisplayName,
    validateProfile 
  } = useProfile();

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    social: {
      twitter: '',
      linkedin: '',
      github: '',
      instagram: ''
    },
    visibility: {
      bio: true,
      stats: true,
      plans: true
    }
  });

  const [errors, setErrors] = useState({});
  const [focusField, setFocusField] = useState(null);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        social: {
          twitter: profile.social?.twitter || '',
          linkedin: profile.social?.linkedin || '',
          github: profile.social?.github || '',
          instagram: profile.social?.instagram || ''
        },
        visibility: {
          bio: profile.visibility?.bio ?? true,
          stats: profile.visibility?.stats ?? true,
          plans: profile.visibility?.plans ?? true
        }
      });
    }
  }, [profile]);

  // Focus on specific field if specified in route params
  useEffect(() => {
    if (route.params?.focus) {
      setFocusField(route.params.focus);
    }
  }, [route.params]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSocialChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social: {
        ...prev.social,
        [platform]: value
      }
    }));
  };

  const handleVisibilityChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less';
    }
    
    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    // Validate social URLs
    const socialFields = ['twitter', 'linkedin', 'github', 'instagram'];
    socialFields.forEach(field => {
      const value = formData.social[field];
      if (value && !isValidUrl(value)) {
        newErrors[`social_${field}`] = `${field} must be a valid URL`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      // Update display name in Firebase Auth if it changed
      if (formData.displayName !== profile?.displayName) {
        await updateDisplayName(formData.displayName);
      }

      // Update profile data
      await updateProfile(formData);
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
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
    cancelButton: {
      padding: 8,
    },
    cancelText: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.semibold,
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
    avatarSection: {
      alignItems: 'center',
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
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.error,
      marginTop: 4,
    },
    characterCount: {
      fontSize: typography.sizes.caption2,
      color: themeColors.secondaryText,
      textAlign: 'right',
      marginTop: 4,
    },
    socialInputGroup: {
      marginBottom: 12,
    },
    socialLabel: {
      fontSize: typography.sizes.caption1,
      fontWeight: typography.weights.medium,
      color: themeColors.secondaryText,
      marginBottom: 4,
    },
    socialInput: {
      borderWidth: 1,
      borderColor: themeColors.progressBackground,
      borderRadius: 6,
      padding: 10,
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryText,
      backgroundColor: themeColors.background,
    },
    visibilitySection: {
      marginTop: 8,
    },
    visibilityItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    visibilityLabel: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryText,
      flex: 1,
    },
    visibilityDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginTop: 4,
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

  if (loading && !profile) {
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
          style={dynamicStyles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={dynamicStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 60 }} />
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
          {/* Avatar Section */}
          <View style={dynamicStyles.section}>
            <View style={dynamicStyles.avatarSection}>
              <AvatarUploaderSimple
                avatarUrl={formData.avatarUrl}
                onAvatarChange={(url) => handleInputChange('avatarUrl', url)}
                size={100}
                editable={true}
              />
            </View>
          </View>

          {/* Basic Info Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Basic Information</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Display Name</Text>
              <TextInput
                style={[
                  dynamicStyles.input,
                  errors.displayName && { borderColor: themeColors.error }
                ]}
                value={formData.displayName}
                onChangeText={(text) => handleInputChange('displayName', text)}
                placeholder="Enter your display name"
                placeholderTextColor={themeColors.secondaryText}
                maxLength={50}
                autoFocus={focusField === 'displayName'}
              />
              {errors.displayName && (
                <Text style={dynamicStyles.errorText}>{errors.displayName}</Text>
              )}
              <Text style={dynamicStyles.characterCount}>
                {formData.displayName.length}/50
              </Text>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Bio</Text>
              <TextInput
                style={[
                  dynamicStyles.input,
                  dynamicStyles.textArea,
                  errors.bio && { borderColor: themeColors.error }
                ]}
                value={formData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                placeholder="Tell us about yourself..."
                placeholderTextColor={themeColors.secondaryText}
                multiline
                maxLength={500}
                autoFocus={focusField === 'bio'}
              />
              {errors.bio && (
                <Text style={dynamicStyles.errorText}>{errors.bio}</Text>
              )}
              <Text style={dynamicStyles.characterCount}>
                {formData.bio.length}/500
              </Text>
            </View>
          </View>

          {/* Social Links Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Social Links</Text>
            
            <View style={dynamicStyles.socialInputGroup}>
              <Text style={dynamicStyles.socialLabel}>Twitter</Text>
              <TextInput
                style={[
                  dynamicStyles.socialInput,
                  errors.social_twitter && { borderColor: themeColors.error }
                ]}
                value={formData.social.twitter}
                onChangeText={(text) => handleSocialChange('twitter', text)}
                placeholder="@username or https://twitter.com/username"
                placeholderTextColor={themeColors.secondaryText}
                autoFocus={focusField === 'social'}
              />
              {errors.social_twitter && (
                <Text style={dynamicStyles.errorText}>{errors.social_twitter}</Text>
              )}
            </View>

            <View style={dynamicStyles.socialInputGroup}>
              <Text style={dynamicStyles.socialLabel}>LinkedIn</Text>
              <TextInput
                style={[
                  dynamicStyles.socialInput,
                  errors.social_linkedin && { borderColor: themeColors.error }
                ]}
                value={formData.social.linkedin}
                onChangeText={(text) => handleSocialChange('linkedin', text)}
                placeholder="https://linkedin.com/in/username"
                placeholderTextColor={themeColors.secondaryText}
              />
              {errors.social_linkedin && (
                <Text style={dynamicStyles.errorText}>{errors.social_linkedin}</Text>
              )}
            </View>

            <View style={dynamicStyles.socialInputGroup}>
              <Text style={dynamicStyles.socialLabel}>GitHub</Text>
              <TextInput
                style={[
                  dynamicStyles.socialInput,
                  errors.social_github && { borderColor: themeColors.error }
                ]}
                value={formData.social.github}
                onChangeText={(text) => handleSocialChange('github', text)}
                placeholder="https://github.com/username"
                placeholderTextColor={themeColors.secondaryText}
              />
              {errors.social_github && (
                <Text style={dynamicStyles.errorText}>{errors.social_github}</Text>
              )}
            </View>

            <View style={dynamicStyles.socialInputGroup}>
              <Text style={dynamicStyles.socialLabel}>Instagram</Text>
              <TextInput
                style={[
                  dynamicStyles.socialInput,
                  errors.social_instagram && { borderColor: themeColors.error }
                ]}
                value={formData.social.instagram}
                onChangeText={(text) => handleSocialChange('instagram', text)}
                placeholder="@username"
                placeholderTextColor={themeColors.secondaryText}
              />
              {errors.social_instagram && (
                <Text style={dynamicStyles.errorText}>{errors.social_instagram}</Text>
              )}
            </View>
          </View>

          {/* Privacy Settings Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Privacy Settings</Text>
            
            <View style={dynamicStyles.visibilitySection}>
              <View style={dynamicStyles.visibilityItem}>
                <View style={{ flex: 1 }}>
                  <Text style={dynamicStyles.visibilityLabel}>Show Bio</Text>
                  <Text style={dynamicStyles.visibilityDescription}>
                    Allow others to see your bio
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleVisibilityChange('bio', !formData.visibility.bio)}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: formData.visibility.bio ? themeColors.primaryOrange : themeColors.progressBackground,
                    justifyContent: 'center',
                    alignItems: formData.visibility.bio ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 2,
                  }}
                >
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#fff',
                  }} />
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.visibilityItem}>
                <View style={{ flex: 1 }}>
                  <Text style={dynamicStyles.visibilityLabel}>Show Stats</Text>
                  <Text style={dynamicStyles.visibilityDescription}>
                    Allow others to see your statistics
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleVisibilityChange('stats', !formData.visibility.stats)}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: formData.visibility.stats ? themeColors.primaryOrange : themeColors.progressBackground,
                    justifyContent: 'center',
                    alignItems: formData.visibility.stats ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 2,
                  }}
                >
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#fff',
                  }} />
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.visibilityItem}>
                <View style={{ flex: 1 }}>
                  <Text style={dynamicStyles.visibilityLabel}>Show Plans</Text>
                  <Text style={dynamicStyles.visibilityDescription}>
                    Allow others to see your public plans
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleVisibilityChange('plans', !formData.visibility.plans)}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: formData.visibility.plans ? themeColors.primaryOrange : themeColors.progressBackground,
                    justifyContent: 'center',
                    alignItems: formData.visibility.plans ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 2,
                  }}
                >
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#fff',
                  }} />
                </TouchableOpacity>
              </View>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;
