// screens/settings/EnhancedProfileSettings.js
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
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/JWTAuthContext';
import apiService from '../../services/apiService';
import Button from '../../components/common/Button';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: screenWidth } = Dimensions.get('window');

const EnhancedProfileSettings = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  const { user, updateProfile } = useAuth();

  // Profile form state
  const [formData, setFormData] = useState({
    // Basic Information (Required)
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    
    // Personal Information (Required)
    dateOfBirth: null,
    gender: '',
    
    // Optional Demographics
    race: '',
    ethnicity: '',
    disability: '',
    preferredLanguage: 'en',
    
    // Location & Timezone
    country: '',
    timezone: '',
    
    // Health & Wellness (Future Features)
    healthGoals: [],
    fitnessLevel: '',
    medicalConditions: '',
    
    // Privacy Settings
    profileVisibility: 'private', // 'public', 'friends', 'private'
    dataSharing: {
      analytics: true,
      research: false,
      marketing: false
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showRacePicker, setShowRacePicker] = useState(false);
  const [showDisabilityPicker, setShowDisabilityPicker] = useState(false);
  
  // Username availability checking
  const [usernameAvailability, setUsernameAvailability] = useState({
    checking: false,
    available: null,
    message: ''
  });

  // Gender options
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'transgender', label: 'Transgender' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' }
  ];

  // Race/Ethnicity options (US Census categories)
  const raceOptions = [
    { value: 'american-indian', label: 'American Indian or Alaska Native' },
    { value: 'asian', label: 'Asian' },
    { value: 'black', label: 'Black or African American' },
    { value: 'hispanic', label: 'Hispanic or Latino' },
    { value: 'native-hawaiian', label: 'Native Hawaiian or Other Pacific Islander' },
    { value: 'white', label: 'White' },
    { value: 'multiracial', label: 'Two or More Races' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' }
  ];

  // Disability options
  const disabilityOptions = [
    { value: 'none', label: 'No disability' },
    { value: 'visual', label: 'Visual impairment' },
    { value: 'hearing', label: 'Hearing impairment' },
    { value: 'mobility', label: 'Mobility impairment' },
    { value: 'cognitive', label: 'Cognitive impairment' },
    { value: 'mental-health', label: 'Mental health condition' },
    { value: 'chronic-illness', label: 'Chronic illness' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' }
  ];

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  // Load profile data from backend
  const loadProfileData = async () => {
    try {
      setProfileLoading(true);
      console.log('EnhancedProfileSettings: Loading profile data...');
      const result = await apiService.getProfile();
      if (result.success && result.data) {
        const profileData = result.data;
        console.log('EnhancedProfileSettings: Profile data loaded:', profileData);
        
        setFormData(prev => ({
          ...prev,
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          username: profileData.username || '',
          phoneNumber: profileData.phoneNumber || '',
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
          gender: profileData.gender || '',
          race: profileData.race || '',
          ethnicity: profileData.ethnicity || '',
          disability: profileData.disability || '',
          preferredLanguage: profileData.preferredLanguage || 'en',
          country: profileData.country || '',
          timezone: profileData.timezone || '',
          healthGoals: profileData.healthGoals || [],
          fitnessLevel: profileData.fitnessLevel || '',
          medicalConditions: profileData.medicalConditions || '',
          profileVisibility: profileData.profileVisibility || 'private',
          dataSharing: profileData.dataSharing || {
            analytics: true,
            research: false,
            marketing: false
          }
        }));
      } else {
        console.log('EnhancedProfileSettings: Failed to load profile:', result.error);
        // Fallback to user data from auth context
        setFormData(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          username: user.username || '',
          phoneNumber: user.phoneNumber || '',
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
          gender: user.gender || '',
          race: user.race || '',
          ethnicity: user.ethnicity || '',
          disability: user.disability || '',
          preferredLanguage: user.preferredLanguage || 'en',
          country: user.country || '',
          timezone: user.timezone || '',
          healthGoals: user.healthGoals || [],
          fitnessLevel: user.fitnessLevel || '',
          medicalConditions: user.medicalConditions || '',
          profileVisibility: user.profileVisibility || 'private',
          dataSharing: user.dataSharing || {
            analytics: true,
            research: false,
            marketing: false
          }
        }));
      }
    } catch (error) {
      console.error('EnhancedProfileSettings: Error loading profile:', error);
      // Fallback to user data from auth context
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
        gender: user.gender || '',
        race: user.race || '',
        ethnicity: user.ethnicity || '',
        disability: user.disability || '',
        preferredLanguage: user.preferredLanguage || 'en',
        country: user.country || '',
        timezone: user.timezone || '',
        healthGoals: user.healthGoals || [],
        fitnessLevel: user.fitnessLevel || '',
        medicalConditions: user.medicalConditions || '',
        profileVisibility: user.profileVisibility || 'private',
        dataSharing: user.dataSharing || {
          analytics: true,
          research: false,
          marketing: false
        }
      }));
    } finally {
      setProfileLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeout) {
        clearTimeout(usernameTimeout);
      }
    };
  }, [usernameTimeout]);

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

  const handleNestedInputChange = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  // Username validation and availability checking
  const validateUsername = (username) => {
    if (!username.trim()) {
      return { valid: false, message: 'Username is required' };
    }
    if (username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { valid: false, message: 'Username must be less than 20 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    if (username.startsWith('_') || username.endsWith('_')) {
      return { valid: false, message: 'Username cannot start or end with underscore' };
    }
    return { valid: true, message: '' };
  };

  const checkUsernameAvailability = async (username) => {
    if (!username.trim()) {
      setUsernameAvailability({ checking: false, available: null, message: '' });
      return;
    }

    const validation = validateUsername(username);
    if (!validation.valid) {
      setUsernameAvailability({ checking: false, available: false, message: validation.message });
      return;
    }

    setUsernameAvailability({ checking: true, available: null, message: 'Checking availability...' });

    try {
      const result = await apiService.checkUsernameAvailability(username);
      if (result.success) {
        setUsernameAvailability({
          checking: false,
          available: result.data.available,
          message: result.data.available ? 'Username is available!' : 'Username is already taken'
        });
      } else {
        setUsernameAvailability({
          checking: false,
          available: false,
          message: result.error?.message || 'Error checking username availability'
        });
      }
    } catch (error) {
      console.error('Username availability check error:', error);
      setUsernameAvailability({
        checking: false,
        available: false,
        message: 'Error checking username availability'
      });
    }
  };

  // Debounced username checking
  const [usernameTimeout, setUsernameTimeout] = useState(null);
  const handleUsernameChange = (value) => {
    handleInputChange('username', value);
    
    // Clear previous timeout
    if (usernameTimeout) {
      clearTimeout(usernameTimeout);
    }
    
    // Set new timeout for checking availability
    const timeout = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500); // 500ms delay
    
    setUsernameTimeout(timeout);
  };

  // Age validation with detailed message
  const validateAge = (dateOfBirth) => {
    if (!dateOfBirth) return { valid: false, message: 'Date of birth is required' };
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;
    
    if (actualAge < 18) {
      return {
        valid: false,
        message: 'You must be at least 18 years old to use this app',
        showDetailedAlert: true
      };
    }
    
    return { valid: true, message: '' };
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else {
      const usernameValidation = validateUsername(formData.username);
      if (!usernameValidation.valid) {
        newErrors.username = usernameValidation.message;
      } else if (usernameAvailability.available === false) {
        newErrors.username = 'Username is not available';
      }
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const ageValidation = validateAge(formData.dateOfBirth);
      if (!ageValidation.valid) {
        newErrors.dateOfBirth = ageValidation.message;
        // Store the detailed alert flag for later use
        if (ageValidation.showDetailedAlert) {
          newErrors.showAgeAlert = true;
        }
      }
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      // Check if we need to show the detailed age restriction alert
      if (errors.showAgeAlert) {
        Alert.alert(
          'Age Restriction',
          'We appreciate your interest in our Flow app! However, our current version is designed for users who are 18 years and older.\n\n' +
          'This age restriction is in place due to:\n' +
          '• Data privacy regulations\n' +
          '• Health and wellness content guidelines\n' +
          '• User safety considerations\n\n' +
          'We are working on developing features suitable for younger users in future versions. Thank you for your understanding!',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      }
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth?.toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await apiService.updateProfile(profileData);
      
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        
        // Refresh profile data in auth context
        if (updateProfile) {
          await updateProfile(result.data);
        }
        
        // Force refresh profile data by reloading it
        await loadProfileData();
        
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('dateOfBirth', selectedDate);
      
      // Real-time age validation
      const ageValidation = validateAge(selectedDate);
      if (!ageValidation.valid && ageValidation.showDetailedAlert) {
        // Show the detailed age restriction alert immediately
        setTimeout(() => {
          Alert.alert(
            'Age Restriction',
            'We appreciate your interest in our Flow app! However, our current version is designed for users who are 18 years and older.\n\n' +
            'This age restriction is in place due to:\n' +
            '• Data privacy regulations\n' +
            '• Health and wellness content guidelines\n' +
            '• User safety considerations\n\n' +
            'We are working on developing features suitable for younger users in future versions. Thank you for your understanding!',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }, 100); // Small delay to ensure the date picker is closed
      }
    }
  };

  const renderPickerModal = (title, options, selectedValue, onSelect, visible, onClose) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.primaryText }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.primaryText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  { borderBottomColor: themeColors.border },
                  selectedValue === option.value && { backgroundColor: themeColors.primaryOrange + '20' }
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={[styles.optionText, { color: themeColors.primaryText }]}>
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={20} color={themeColors.primaryOrange} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.primaryText,
      marginBottom: 15,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: themeColors.secondaryText,
      marginBottom: 15,
      fontStyle: 'italic',
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.primaryText,
      marginBottom: 8,
    },
    requiredLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.primaryText,
      marginBottom: 8,
    },
    requiredAsterisk: {
      color: themeColors.error,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: themeColors.primaryText,
      backgroundColor: themeColors.inputBackground,
    },
    pickerButton: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: themeColors.inputBackground,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerText: {
      fontSize: 16,
      color: themeColors.primaryText,
    },
    dateButton: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: themeColors.inputBackground,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 16,
      color: themeColors.primaryText,
    },
    errorText: {
      color: themeColors.error,
      fontSize: 12,
      marginTop: 4,
    },
    usernameContainer: {
      position: 'relative',
    },
    usernameInput: {
      paddingRight: 40, // Make room for status icon
    },
    usernameStatus: {
      position: 'absolute',
      right: 12,
      top: 12,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    usernameMessage: {
      fontSize: 12,
      marginTop: 4,
      fontStyle: 'italic',
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    switchLabel: {
      fontSize: 14,
      color: themeColors.primaryText,
      flex: 1,
    },
    switchDescription: {
      fontSize: 12,
      color: themeColors.secondaryText,
      marginTop: 4,
    },
    saveButton: {
      marginTop: 20,
      marginBottom: 40,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    modalOptions: {
      maxHeight: 400,
    },
    optionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
    },
    optionText: {
      fontSize: 16,
      flex: 1,
    },
  });

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView 
        style={dynamicStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {profileLoading ? (
          <View style={dynamicStyles.loadingContainer}>
            <Text style={dynamicStyles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
          
          {/* Basic Information Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Basic Information</Text>
            <Text style={dynamicStyles.sectionSubtitle}>
              Required information for your account
            </Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.requiredLabel}>
                First Name <Text style={dynamicStyles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[dynamicStyles.input, errors.firstName && { borderColor: themeColors.error }]}
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                placeholder="Enter your first name"
                placeholderTextColor={themeColors.secondaryText}
                autoCapitalize="words"
              />
              {errors.firstName && <Text style={dynamicStyles.errorText}>{errors.firstName}</Text>}
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.requiredLabel}>
                Last Name <Text style={dynamicStyles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[dynamicStyles.input, errors.lastName && { borderColor: themeColors.error }]}
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                placeholder="Enter your last name"
                placeholderTextColor={themeColors.secondaryText}
                autoCapitalize="words"
              />
              {errors.lastName && <Text style={dynamicStyles.errorText}>{errors.lastName}</Text>}
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.requiredLabel}>
                Username <Text style={dynamicStyles.requiredAsterisk}>*</Text>
              </Text>
              <View style={dynamicStyles.usernameContainer}>
                <TextInput
                  style={[
                    dynamicStyles.input, 
                    dynamicStyles.usernameInput,
                    errors.username && { borderColor: themeColors.error },
                    usernameAvailability.available === true && { borderColor: themeColors.success },
                    usernameAvailability.available === false && { borderColor: themeColors.error }
                  ]}
                  value={formData.username}
                  onChangeText={handleUsernameChange}
                  placeholder="Enter your username"
                  placeholderTextColor={themeColors.secondaryText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={dynamicStyles.usernameStatus}>
                  {usernameAvailability.checking && (
                    <Ionicons name="time-outline" size={16} color={themeColors.secondaryText} />
                  )}
                  {usernameAvailability.available === true && (
                    <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
                  )}
                  {usernameAvailability.available === false && (
                    <Ionicons name="close-circle" size={16} color={themeColors.error} />
                  )}
                </View>
              </View>
              {errors.username && <Text style={dynamicStyles.errorText}>{errors.username}</Text>}
              {!errors.username && usernameAvailability.message && (
                <Text style={[
                  dynamicStyles.usernameMessage,
                  { 
                    color: usernameAvailability.available === true ? themeColors.success : 
                           usernameAvailability.available === false ? themeColors.error : 
                           themeColors.secondaryText 
                  }
                ]}>
                  {usernameAvailability.message}
                </Text>
              )}
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Phone Number</Text>
              <TextInput
                style={dynamicStyles.input}
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Personal Information</Text>
            <Text style={dynamicStyles.sectionSubtitle}>
              Required demographic information
            </Text>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.requiredLabel}>
                Date of Birth <Text style={dynamicStyles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={[dynamicStyles.dateButton, errors.dateOfBirth && { borderColor: themeColors.error }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={dynamicStyles.dateText}>
                  {formData.dateOfBirth ? formData.dateOfBirth.toLocaleDateString() : 'Select your date of birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={themeColors.secondaryText} />
              </TouchableOpacity>
              {errors.dateOfBirth && <Text style={dynamicStyles.errorText}>{errors.dateOfBirth}</Text>}
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.requiredLabel}>
                Gender <Text style={dynamicStyles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={[dynamicStyles.pickerButton, errors.gender && { borderColor: themeColors.error }]}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text style={dynamicStyles.pickerText}>
                  {formData.gender ? genderOptions.find(opt => opt.value === formData.gender)?.label : 'Select your gender'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={themeColors.secondaryText} />
              </TouchableOpacity>
              {errors.gender && <Text style={dynamicStyles.errorText}>{errors.gender}</Text>}
            </View>
          </View>

          {/* Optional Demographics Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Optional Demographics</Text>
            <Text style={dynamicStyles.sectionSubtitle}>
              Optional information to help us improve our services
            </Text>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Race/Ethnicity</Text>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => setShowRacePicker(true)}
              >
                <Text style={dynamicStyles.pickerText}>
                  {formData.race ? raceOptions.find(opt => opt.value === formData.race)?.label : 'Select race/ethnicity (optional)'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={themeColors.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Disability Status</Text>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => setShowDisabilityPicker(true)}
              >
                <Text style={dynamicStyles.pickerText}>
                  {formData.disability ? disabilityOptions.find(opt => opt.value === formData.disability)?.label : 'Select disability status (optional)'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={themeColors.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Preferred Language</Text>
              <TextInput
                style={dynamicStyles.input}
                value={formData.preferredLanguage}
                onChangeText={(value) => handleInputChange('preferredLanguage', value)}
                placeholder="e.g., en, es, fr"
                placeholderTextColor={themeColors.secondaryText}
              />
            </View>
          </View>

          {/* Privacy Settings Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Privacy Settings</Text>
            <Text style={dynamicStyles.sectionSubtitle}>
              Control how your data is used and shared
            </Text>

            <View style={dynamicStyles.switchContainer}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.switchLabel}>Analytics & Usage Data</Text>
                <Text style={dynamicStyles.switchDescription}>
                  Help us improve the app by sharing anonymous usage data
                </Text>
              </View>
              <Switch
                value={formData.dataSharing.analytics}
                onValueChange={(value) => handleNestedInputChange('dataSharing', 'analytics', value)}
                trackColor={{ false: themeColors.border, true: themeColors.primaryOrange }}
                thumbColor={formData.dataSharing.analytics ? '#fff' : themeColors.secondaryText}
              />
            </View>

            <View style={dynamicStyles.switchContainer}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.switchLabel}>Research Participation</Text>
                <Text style={dynamicStyles.switchDescription}>
                  Allow your anonymized data to be used for research purposes
                </Text>
              </View>
              <Switch
                value={formData.dataSharing.research}
                onValueChange={(value) => handleNestedInputChange('dataSharing', 'research', value)}
                trackColor={{ false: themeColors.border, true: themeColors.primaryOrange }}
                thumbColor={formData.dataSharing.research ? '#fff' : themeColors.secondaryText}
              />
            </View>

            <View style={dynamicStyles.switchContainer}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.switchLabel}>Marketing Communications</Text>
                <Text style={dynamicStyles.switchDescription}>
                  Receive updates about new features and promotions
                </Text>
              </View>
              <Switch
                value={formData.dataSharing.marketing}
                onValueChange={(value) => handleNestedInputChange('dataSharing', 'marketing', value)}
                trackColor={{ false: themeColors.border, true: themeColors.primaryOrange }}
                thumbColor={formData.dataSharing.marketing ? '#fff' : themeColors.secondaryText}
              />
            </View>
          </View>

          {/* Save Button */}
          <Button
            title="Save Profile"
            onPress={handleSave}
            loading={loading}
            style={dynamicStyles.saveButton}
          />
        </ScrollView>
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfBirth || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}

        {/* Gender Picker Modal */}
        {renderPickerModal(
          'Select Gender',
          genderOptions,
          formData.gender,
          (value) => handleInputChange('gender', value),
          showGenderPicker,
          () => setShowGenderPicker(false)
        )}

        {/* Race Picker Modal */}
        {renderPickerModal(
          'Select Race/Ethnicity',
          raceOptions,
          formData.race,
          (value) => handleInputChange('race', value),
          showRacePicker,
          () => setShowRacePicker(false)
        )}

        {/* Disability Picker Modal */}
        {renderPickerModal(
          'Select Disability Status',
          disabilityOptions,
          formData.disability,
          (value) => handleInputChange('disability', value),
          showDisabilityPicker,
          () => setShowDisabilityPicker(false)
        )}
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalOptions: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#3E3E3E', // Static color instead of themeColors.primaryText
    textAlign: 'center',
  },
});

export default EnhancedProfileSettings;
