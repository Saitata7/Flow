// src/screens/auth/Register.js
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Animated, 
  Platform, 
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useAuth } from '../../context/JWTAuthContext';
import { validateInput } from '../../utils/validation';
import { colors, typography, layout, useAppTheme } from '../../../styles';

const fallbackColors = {
  background: '#FFF0E6',
  primaryOrange: '#FF9500',
  placeholderText: '#A0A0A0',
  cardBackground: '#FFFFFF',
  primaryText: '#1D1D1F',
  error: '#FF3B30',
  progressBackground: '#E5E5EA',
};

const Register = ({ navigation }) => {
  const { 
    register, 
    isLoading
  } = useAuth();
  const { colors: themeColors } = useAppTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    username: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const safeColors = themeColors || fallbackColors;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    console.log('🔍 Register: handleRegister button pressed!');
    
    // Validate all required fields
    const firstNameValidation = validateInput('title', formData.firstName);
    const lastNameValidation = validateInput('title', formData.lastName);
    const nameValidation = validateInput('title', formData.name);
    const emailValidation = validateInput('email', formData.email);
    const usernameValidation = validateInput('username', formData.username);
    const passwordValidation = validateInput('password', formData.password);
    const confirmPasswordValidation = validateInput('password', formData.confirmPassword);
    const termsValidation = { valid: formData.acceptTerms, error: formData.acceptTerms ? null : 'You must accept the terms and conditions' };

    // Validate date of birth (age 18+)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    const dateOfBirthValidation = {
      valid: formData.dateOfBirth && actualAge >= 18,
      error: !formData.dateOfBirth ? 'Date of birth is required' : 
             actualAge < 18 ? 'You must be at least 18 years old' : null
    };

    // Validate gender
    const genderValidation = {
      valid: formData.gender && ['male', 'female', 'other', 'prefer_not_to_say'].includes(formData.gender.toLowerCase()),
      error: !formData.gender ? 'Gender is required' : 'Please select a valid gender'
    };

    // Validate password match
    const passwordMatchValidation = {
      valid: formData.password === formData.confirmPassword,
      error: formData.password !== formData.confirmPassword ? 'Passwords do not match' : null
    };

    if (!firstNameValidation.valid || !lastNameValidation.valid || !nameValidation.valid || 
        !emailValidation.valid || !usernameValidation.valid || !passwordValidation.valid || 
        !confirmPasswordValidation.valid || !dateOfBirthValidation.valid || 
        !genderValidation.valid || !passwordMatchValidation.valid || !termsValidation.valid) {
      console.log('🔍 Register: Validation failed, showing errors');
      setFormErrors({
        firstName: firstNameValidation.error,
        lastName: lastNameValidation.error,
        name: nameValidation.error,
        email: emailValidation.error,
        username: usernameValidation.error,
        password: passwordValidation.error,
        confirmPassword: confirmPasswordValidation.error || passwordMatchValidation.error,
        dateOfBirth: dateOfBirthValidation.error,
        gender: genderValidation.error,
        acceptTerms: termsValidation.error,
      });
      setShowToast(true);
      return;
    }

    try {
      console.log('🔍 Register: Starting registration process');
      // Clear previous errors
      setErrorMessage('');
      
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      });
      console.log('🔍 Register: Registration result:', result);
      
      if (result.success) {
        console.log('🔍 Register: Registration successful, navigating to Main');
        // Navigate to main app after successful registration
        navigation.getParent()?.navigate('Main');
      } else {
        console.log('🔍 Register: Registration failed, showing error:', result.error);
        // Set error message and show toast
        setErrorMessage(result.error || 'Registration failed. Please try again.');
        setShowToast(true);
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
      setShowToast(true);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: slideAnim,
      },
    ],
  };

  return (
    <SafeAreaWrapper style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFF0E6', '#FFE4CC', '#FFD9B3']}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <Animated.View style={[styles.headerSection, animatedStyle]}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[safeColors.primaryOrange, '#FFB84D']}
                style={styles.logoGradient}
              >
                <Ionicons name="leaf" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={[styles.welcomeTitle, { color: safeColors.primaryText }]}>
              Create Account
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: safeColors.primaryText }]}>
              Join Flow and start your journey to better habits
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View style={[styles.formSection, animatedStyle]}>
            {/* First Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                First Name
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.firstName && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={formErrors.firstName ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="Enter your first name"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  accessibilityLabel="First name input"
                />
              </View>
              {formErrors.firstName && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.firstName}
                </Text>
              )}
            </View>

            {/* Last Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Last Name
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.lastName && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={formErrors.lastName ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="Enter your last name"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  autoCapitalize="words"
                  autoComplete="family-name"
                  accessibilityLabel="Last name input"
                />
              </View>
              {formErrors.lastName && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.lastName}
                </Text>
              )}
            </View>

            {/* Display Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Display Name
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.name && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={formErrors.name ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="How should we call you?"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  autoCapitalize="words"
                  autoComplete="name"
                  accessibilityLabel="Display name input"
                />
              </View>
              {formErrors.name && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.name}
                </Text>
              )}
            </View>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Username
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.username && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="at-outline" 
                  size={20} 
                  color={formErrors.username ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="Choose a username"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                  autoCapitalize="none"
                  autoComplete="username"
                  accessibilityLabel="Username input"
                />
              </View>
              {formErrors.username && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.username}
                </Text>
              )}
            </View>

            {/* Date of Birth Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Date of Birth
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.dateOfBirth && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color={formErrors.dateOfBirth ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.dateOfBirth}
                  onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                  keyboardType="numeric"
                  accessibilityLabel="Date of birth input"
                />
              </View>
              {formErrors.dateOfBirth && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.dateOfBirth}
                </Text>
              )}
            </View>

            {/* Gender Selection */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Gender
              </Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other', 'prefer_not_to_say'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    onPress={() => handleInputChange('gender', gender)}
                    style={[
                      styles.genderOption,
                      formData.gender === gender && { backgroundColor: safeColors.primaryOrange },
                      { borderColor: safeColors.placeholderText }
                    ]}
                  >
                    <Text style={[
                      styles.genderText,
                      { color: formData.gender === gender ? '#FFFFFF' : safeColors.primaryText }
                    ]}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1).replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.gender && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.gender}
                </Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Email Address
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.email && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={formErrors.email ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="Enter your email"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  accessibilityLabel="Email input"
                />
              </View>
              {formErrors.email && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Password
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.password && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={formErrors.password ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="Create a password"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={safeColors.placeholderText} 
                  />
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Confirm Password
              </Text>
              <View style={[
                styles.inputWrapper,
                formErrors.confirmPassword && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={formErrors.confirmPassword ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  accessibilityLabel="Confirm password input"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                  accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={safeColors.placeholderText} 
                  />
                </TouchableOpacity>
              </View>
              {formErrors.confirmPassword && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              onPress={() => handleInputChange('acceptTerms', !formData.acceptTerms)}
              style={styles.termsContainer}
            >
              <View style={[
                styles.checkbox,
                formData.acceptTerms && { backgroundColor: safeColors.primaryOrange }
              ]}>
                {formData.acceptTerms && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.termsText, { color: safeColors.primaryText }]}>
                I agree to the{' '}
                <Text style={{ color: safeColors.primaryOrange, fontWeight: typography.weights.semibold }}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={{ color: safeColors.primaryOrange, fontWeight: typography.weights.semibold }}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
            {formErrors.acceptTerms && (
              <Text style={[styles.errorText, { color: safeColors.error }]}>
                {formErrors.acceptTerms}
              </Text>
            )}

            {/* Register Button */}
            <Button
              variant="primary"
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: safeColors.placeholderText }]} />
              <Text style={[styles.dividerText, { color: safeColors.placeholderText }]}>
                or
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: safeColors.placeholderText }]} />
            </View>

            {/* Sign In Button */}
            <Button
              variant="secondary"
              title="Already have an account? Sign In"
              onPress={() => {
                console.log('🔍 Register: Sign In button pressed!');
                navigation.navigate('Login');
              }}
              style={styles.signinButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {showToast && (
        <Toast
          type="error"
          message={errorMessage || 'Registration failed. Please try again.'}
          onDismiss={() => {
            setShowToast(false);
            setErrorMessage('');
          }}
          position="top"
        />
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.spacing.lg,
    paddingTop: layout.spacing.lg,
    paddingBottom: layout.spacing.sm,
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: layout.spacing.lg,
  },
  logoContainer: {
    marginBottom: layout.spacing.md,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: typography.largeTitle.fontSize,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: layout.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.body,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  
  // Form Section
  formSection: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: layout.spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
    marginBottom: layout.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: layout.radii.squircle,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
  },
  inputWrapperError: {
    borderColor: fallbackColors.error,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: layout.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.body,
    paddingVertical: layout.spacing.xs,
  },
  passwordToggle: {
    padding: layout.spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.caption2,
    marginTop: layout.spacing.xs,
    fontWeight: typography.weights.medium,
  },
  
  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.sm,
  },
  genderOption: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.radii.squircle,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  genderText: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.medium,
  },
  
  // Terms and Conditions
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.lg,
    paddingHorizontal: layout.spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: fallbackColors.placeholderText,
    marginRight: layout.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: typography.sizes.caption1,
    lineHeight: 20,
  },
  
  // Buttons
  registerButton: {
    marginBottom: layout.spacing.lg,
  },
  signinButton: {
    marginBottom: layout.spacing.md,
  },
  
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: layout.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: typography.sizes.caption1,
    marginHorizontal: layout.spacing.md,
    fontWeight: typography.weights.medium,
  },
});

export default Register;