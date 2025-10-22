// src/screens/auth/ForgotPassword.js
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
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useAuth } from '../../context/AuthContext';
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

const ForgotPassword = ({ navigation }) => {
  const authContext = useAuth();
  
  const { 
    resetPassword, 
    isLoading, 
    error, 
    clearError
  } = authContext;
  const { colors: themeColors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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

          const handleResetPassword = async () => {
            console.log('🔍 ForgotPassword: handleResetPassword button pressed!');
            // Clear previous errors
            clearError();
            setFormError(null);
            
            const emailValidation = validateInput('email', email);
            if (!emailValidation.valid) {
              console.log('🔍 ForgotPassword: Email validation failed:', emailValidation.error);
              setFormError(emailValidation.error);
              setShowToast(true);
              return;
            }

            try {
              console.log('🔍 ForgotPassword: Attempting password reset for:', email);
              const result = await resetPassword(email);
              console.log('🔍 ForgotPassword: Reset password result:', result);
              
              if (result.success) {
                console.log('✅ ForgotPassword: Password reset email sent successfully');
                setShowSuccess(true);
                setShowToast(true);
                setEmail('');
                // Navigate back to Login after 3 seconds
                setTimeout(() => {
                  console.log('🔍 ForgotPassword: Navigating back to Login');
                  navigation.navigate('Login');
                }, 3000);
              } else {
                console.log('❌ ForgotPassword: Password reset failed');
                setShowToast(true);
              }
            } catch (err) {
              console.error('❌ ForgotPassword: Password reset error:', err);
              setShowToast(true);
            }
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
                <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={[styles.welcomeTitle, { color: safeColors.primaryText }]}>
              Reset Password
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: safeColors.primaryText }]}>
              Enter your email to receive a password reset link
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
                formError && styles.inputWrapperError,
                { backgroundColor: safeColors.cardBackground }
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={formError ? safeColors.error : safeColors.placeholderText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: safeColors.primaryText }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={safeColors.placeholderText}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setFormError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  accessibilityLabel="Email input"
                />
              </View>
              {formError && (
                <Text style={[styles.errorText, { color: safeColors.error }]}>
                  {formError}
                </Text>
              )}
            </View>


            {/* Send Reset Link Button */}
            <Button
              variant="primary"
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.resetButton}
            />

            {/* Back to Login Button */}
            <Button
              variant="secondary"
              title="Back to Login"
              onPress={() => {
                console.log('🔍 ForgotPassword: Back to Login button pressed!');
                navigation.navigate('Login');
              }}
              style={styles.backButton}
            />

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {showToast && (
        <Toast
          type={showSuccess ? 'success' : 'error'}
          message={showSuccess ? 
            `Password reset email sent to ${email}! Check your inbox and spam folder. The email may take 5-10 minutes to arrive.` : 
            (error || 'Please check your email and try again.')
          }
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
  errorText: {
    fontSize: typography.sizes.caption2,
    marginTop: layout.spacing.xs,
    fontWeight: typography.weights.medium,
  },
  
  // Buttons
  resetButton: {
    marginBottom: layout.spacing.md,
  },
  backButton: {
    marginBottom: layout.spacing.sm,
  },
  
});

export default ForgotPassword;