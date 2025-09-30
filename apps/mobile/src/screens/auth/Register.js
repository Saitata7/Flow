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
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, validateUsername } from '../../utils/validation';
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
  const { register, isLoading, error, clearError } = useAuth();
  const { colors: themeColors } = useAppTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
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
    // Validate form
    const nameValidation = validateUsername(formData.name);
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    const confirmPasswordValidation = formData.password === formData.confirmPassword 
      ? { valid: true } 
      : { valid: false, error: 'Passwords do not match' };
    const termsValidation = formData.acceptTerms 
      ? { valid: true } 
      : { valid: false, error: 'You must accept the terms and conditions' };

    if (!nameValidation.valid || !emailValidation.valid || !passwordValidation.valid || 
        !confirmPasswordValidation.valid || !termsValidation.valid) {
      setFormErrors({
        name: nameValidation.error,
        email: emailValidation.error,
        password: passwordValidation.error,
        confirmPassword: confirmPasswordValidation.error,
        acceptTerms: termsValidation.error,
      });
      setShowToast(true);
      return;
    }

    try {
      // Clear previous errors
      clearError();
      
      const result = await register(formData.email, formData.password, formData.name);
      
      if (result.success) {
        // Navigate to main app after successful registration
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        // Show error toast
        setShowToast(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
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
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: safeColors.primaryText }]}>
                Full Name
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
                  placeholder="Enter your full name"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  autoCapitalize="words"
                  autoComplete="name"
                  accessibilityLabel="Full name input"
                />
              </View>
              {formErrors.name && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.name}
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
              testID="register-button"
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
              onPress={() => navigation.navigate('Login')}
              style={styles.signinButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {showToast && (
        <Toast
          type="error"
          message={error || 'Registration failed. Please try again.'}
          onDismiss={() => {
            setShowToast(false);
            clearError();
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