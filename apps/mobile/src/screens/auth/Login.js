// src/screens/auth/Login.js
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
import { validateEmail, validatePassword } from '../../utils/validation';
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
  const { login, isLoading, error, clearError } = useAuth();
  const { colors: themeColors } = useAppTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async () => {
    const { email, password } = formData;
    
    // Clear previous errors
    clearError();
    setFormErrors({});
    
    // Validate inputs
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.valid || !passwordValidation.valid) {
      setFormErrors({
        email: emailValidation.error,
        password: passwordValidation.error,
      });
      setShowToast(true);
      return;
    }

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Navigate to main app after successful login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        // Show error toast
        setShowToast(true);
      }
    } catch (err) {
      console.error('Login error:', err);
      setShowToast(true);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleGoogleSignIn = async () => {
    // Google Sign-In not implemented yet - show message
    setShowToast(true);
  };

  const handleSkip = () => {
    // Navigate to main app as guest
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
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
              Sign in to continue your flow journey
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View style={[styles.formSection, animatedStyle]}>
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
                  placeholder="Enter your password"
                  placeholderTextColor={safeColors.placeholderText}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordContainer}
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
              loading={isLoading}
              style={styles.loginButton}
              testID="login-button"
            />

            {/* Google Sign-In Button */}
            <Button
              variant="secondary"
              title="Sign in with Google"
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
              icon="logo-google"
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: safeColors.placeholderText }]} />
              <Text style={[styles.dividerText, { color: safeColors.placeholderText }]}>
                or
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: safeColors.placeholderText }]} />
            </View>

            {/* Sign Up Button */}
            <Button
              variant="secondary"
              title="Create New Account"
              onPress={() => navigation.navigate('Register')}
              style={styles.signupButton}
            />

            {/* Skip Button */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipContainer}
            >
              <Text style={[styles.skipText, { color: safeColors.placeholderText }]}>
                Continue as Guest
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {showToast && (
        <Toast
          type="error"
          message={error || 'Login failed. Please try again.'}
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
    paddingTop: layout.spacing.xl,
    paddingBottom: layout.spacing.xl,
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: layout.spacing.xl,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: layout.spacing.lg,
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
  
  // Forgot Password
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: layout.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
  },
  
  // Buttons
  loginButton: {
    marginBottom: layout.spacing.lg,
  },
  googleButton: {
    marginBottom: layout.spacing.lg,
  },
  signupButton: {
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
  
  // Skip Button
  skipContainer: {
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
  },
  skipText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
});

export default Login;