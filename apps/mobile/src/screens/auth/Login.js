// src/screens/auth/Login.js
import React, { useState, useRef, useEffect } from 'react';
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
  StatusBar,
  Alert
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

const Login = ({ navigation, route }) => {
  const { 
    login, 
    isLoading, 
    error, 
    clearError 
  } = useAuth();
  
  const { colors: themeColors } = useAppTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const safeColors = themeColors || fallbackColors;

  // Enhanced form validation - only validate for form state, don't show errors until submit
  const validateForm = () => {
    const emailValidation = validateInput('email', formData.email);
    const passwordValidation = validateInput('password', formData.password);
    
    // Don't set formErrors here - only check validity for button state
    const isValid = emailValidation.valid && passwordValidation.valid;
    setIsFormValid(isValid);
    return isValid;
  };

  // Real-time validation on input change - only for form state, not error display
  useEffect(() => {
    validateForm();
  }, [formData.email, formData.password]);

  // Auto-focus and navigation effects
  useEffect(() => {
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

    // Auto-focus email field on mount
    const timer = setTimeout(() => {
      // Focus will be handled by TextInput autoFocus prop
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show toast with custom message and type
  const showCustomToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const playSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    console.log('🔐 Login: Starting Firebase authentication...');
    console.log('🔐 Login: Email:', formData.email);
    console.log('🔐 Login: Password length:', formData.password.length);
    console.log('🔐 Login: isLoading:', isLoading);
    console.log('🔐 Login: isSubmitting:', isSubmitting);
    
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      console.log('🔐 Login: Already submitting, ignoring request');
      return;
    }

    const { email, password } = formData;
    
    // Clear previous errors
    clearError();
    setFormErrors({});
    
    // Validate form before submission
    const emailValidation = validateInput('email', email);
    const passwordValidation = validateInput('password', password);
    
    const errors = {};
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.error;
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showCustomToast('Please check your email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔐 Login: Calling Firebase authentication...');
      
      // Use Firebase authentication with proper error handling
      const result = await login(email, password);
      
      if (result.success) {
        console.log('✅ Login: Firebase authentication successful');
        console.log('✅ Login: User data:', result.user);
        
        // Play success animation
        playSuccessAnimation();
        
        // Show success toast
        showCustomToast('Login successful!', 'success');
        
        // Navigate to main app after a short delay
        setTimeout(() => {
          navigation.navigate('Main');
        }, 1500);
      } else {
        console.log('❌ Login: Authentication failed:', result.error);
        showCustomToast(result.error, 'error');
        setFormErrors({ general: result.error });
      }
      
    } catch (error) {
      console.error('❌ Login: Firebase authentication failed:', error);
      
      // Handle specific Firebase error codes
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('user-not-found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('wrong-password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('user-disabled')) {
          errorMessage = 'This account has been disabled.';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error.message.includes('network-request-failed')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showCustomToast(errorMessage, 'error');
      setFormErrors({ general: errorMessage });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔐 Login: Google Sign-In not implemented yet');
    showCustomToast('Google Sign-In coming soon!', 'info');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
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
              Welcome Back
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: safeColors.primaryText }]}>
              Sign in to continue your Flow journey
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View style={[styles.formSection, animatedStyle]}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
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
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  accessibilityLabel="Email input"
                  editable={!isSubmitting && !isLoading}
                />
              </View>
              {formErrors.email && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formErrors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
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
                  placeholder="Enter your password"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  accessibilityLabel="Password input"
                  editable={!isSubmitting && !isLoading}
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

            {/* Forgot Password */}
            <TouchableOpacity 
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
              disabled={isSubmitting || isLoading}
            >
              <Text style={[styles.forgotPasswordText, { color: safeColors.primaryOrange }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              variant="primary"
              title="Sign In"
              onPress={handleLogin}
              loading={isSubmitting || isLoading}
              disabled={!isFormValid || isSubmitting || isLoading}
              style={styles.loginButton}
            />


            {/* Google Sign-In Button */}
            <Button
              variant="secondary"
              title="Sign in with Google"
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
              icon="logo-google"
              disabled={isSubmitting || isLoading}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: safeColors.placeholderText }]} />
              <Text style={[styles.dividerText, { color: safeColors.placeholderText }]}>
                or
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: safeColors.placeholderText }]} />
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: safeColors.placeholderText }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity 
                onPress={handleRegister}
                disabled={isSubmitting || isLoading}
              >
                <Text style={[styles.registerLink, { color: safeColors.primaryOrange }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {showToast && (
        <Toast
          type={toastType}
          message={toastMessage}
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
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.spacing.lg,
    paddingTop: layout.spacing.xxl,
    paddingBottom: layout.spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: layout.spacing.xxl,
  },
  logoContainer: {
    marginBottom: layout.spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: layout.spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  formSection: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: layout.spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: layout.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapperError: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  inputIcon: {
    marginRight: layout.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: layout.spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    marginTop: layout.spacing.xs,
    marginLeft: layout.spacing.sm,
    fontWeight: typography.weights.medium,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: layout.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  loginButton: {
    marginBottom: layout.spacing.md,
  },
  googleButton: {
    marginBottom: layout.spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    marginHorizontal: layout.spacing.md,
    fontWeight: typography.weights.medium,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: typography.sizes.sm,
  },
  registerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});

export default Login;