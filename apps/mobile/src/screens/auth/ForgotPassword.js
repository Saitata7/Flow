// src/screens/auth/ForgotPassword.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';
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
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeColors = themeColors || fallbackColors;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleResetPassword = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setFormError(emailValidation.error);
      setShowToast(true);
      return;
    }

    try {
      // Clear previous errors
      clearError();
      
      const result = await resetPassword(email);
      
      if (result.success) {
        setShowToast(true);
        setEmail('');
        // Navigate back to Login after success
        setTimeout(() => navigation.navigate('Login'), 2000);
      } else {
        setShowToast(true);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setShowToast(true);
    }
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: safeColors.background }]}
    >
      <Animated.View style={[styles.formCard, animatedStyle, { backgroundColor: safeColors.cardBackground }]}>
        <Text style={[styles.title, { color: safeColors.primaryText }]}>Reset Password</Text>
        <Text style={[styles.infoText, { color: safeColors.primaryText }]}>
          Enter your email to receive a password reset link.
        </Text>
        <TextInput
          style={[styles.input, formError && styles.inputError, { backgroundColor: safeColors.progressBackground, color: safeColors.primaryText }]}
          placeholder="Email"
          placeholderTextColor={safeColors.placeholderText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email input"
        />
        {formError && <Text style={[styles.errorText, { color: safeColors.error }]}>{formError}</Text>}
        <Button
          variant="primary"
          title="Send Reset Link"
          onPress={handleResetPassword}
          loading={isLoading}
          style={styles.button}
        />
        <Button
          variant="text"
          title="Back to Login"
          onPress={() => navigation.navigate('Login')}
          style={styles.linkButton}
        />
      </Animated.View>
      {showToast && (
        <Toast
          type={error ? 'error' : 'success'}
          message={error || 'Reset link sent! Check your email.'}
          onDismiss={() => {
            setShowToast(false);
            clearError();
          }}
          position="top"
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: layout.screen.paddingTop,
    paddingBottom: layout.screen.paddingBottom,
  },
  formCard: {
    borderRadius: layout.squircle.borderRadius,
    ...layout.shadows.cardShadow,
    padding: layout.spacing.lg,
    marginHorizontal: layout.card.marginHorizontal,
    marginVertical: layout.card.marginVertical,
  },
  title: {
    ...typography.styles.largeTitle,
    textAlign: 'center',
    marginBottom: layout.spacing.md,
  },
  infoText: {
    ...typography.styles.body,
    textAlign: 'center',
    marginBottom: layout.spacing.md,
  },
  input: {
    ...typography.styles.body,
    borderRadius: 12,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.sm,
  },
  inputError: {
    borderColor: colors.light?.error || fallbackColors.error,
    borderWidth: 1,
  },
  errorText: {
    ...typography.styles.caption1,
    marginBottom: layout.spacing.sm,
  },
  button: {
    marginTop: layout.spacing.sm,
  },
  linkButton: {
    marginTop: layout.spacing.xs,
  },
});

export default ForgotPassword;