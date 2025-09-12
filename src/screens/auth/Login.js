// src/screens/auth/Login.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validation';
import { generateIdempotencyKey } from '../../utils/idempotency';
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
  const { login, isLoading, error } = useAuth();
  const { colors: themeColors } = useAppTheme();
  const { onSkip } = route.params || {}; // Get onSkip from route params
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
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

  const handleLogin = async ({ email, password }) => {
    const key = generateIdempotencyKey('login', email, new Date());
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
      await login({ email, password, idempotencyKey: key });
      navigation.replace('MainTabs');
    } catch (err) {
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
        <Text style={[styles.title, { color: safeColors.primaryText }]}>Welcome Back</Text>
        <TextInput
          style={[styles.input, formErrors.email && styles.inputError, { backgroundColor: safeColors.progressBackground, color: safeColors.primaryText }]}
          placeholder="Email"
          placeholderTextColor={safeColors.placeholderText}
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email input"
        />
        {formErrors.email && <Text style={[styles.errorText, { color: safeColors.error }]}>{formErrors.email}</Text>}
        <TextInput
          style={[styles.input, formErrors.password && styles.inputError, { backgroundColor: safeColors.progressBackground, color: safeColors.primaryText }]}
          placeholder="Password"
          placeholderTextColor={safeColors.placeholderText}
          value={formData.password}
          onChangeText={(text) => handleInputChange('password', text)}
          secureTextEntry
          accessibilityLabel="Password input"
        />
        {formErrors.password && <Text style={[styles.errorText, { color: safeColors.error }]}>{formErrors.password}</Text>}
        <Button
          variant="primary"
          title="Login"
          onPress={() => handleLogin(formData)}
          loading={isLoading}
          style={styles.button}
          testID="login-button"
        />
        <Button
          variant="text"
          title="Forgot Password?"
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.linkButton}
        />
        <Button
          variant="secondary"
          title="Sign up"
          onPress={() => navigation.navigate('Register')}
          style={styles.button}
        />
        <Button
          variant="text"
          title="Skip for Now"
          onPress={onSkip}
          style={styles.linkButton}
        />
      </Animated.View>
      {showToast && (
        <Toast
          type="error"
          message={error || 'Login failed'}
          onDismiss={() => setShowToast(false)}
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

export default Login;