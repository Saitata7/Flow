// src/screens/auth/Register.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import useAuth from '../../hooks/useAuth';
import { createValidator, validateEmail, validatePassword, validateUsername } from '../../utils/validation';
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
  successGreen: '#34C759',
};

const steps = ['Basic Info', 'Security', 'Preferences', 'Verification', 'Welcome'];
const schema = {
  name: validateUsername,
  email: validateEmail,
  password: validatePassword,
  confirmPassword: (value, { password }) => value === password ? { valid: true } : { valid: false, error: 'Passwords do not match' },
  acceptTerms: (value) => value === true ? { valid: true } : { valid: false, error: 'You must accept the terms' },
  marketingOptIn: () => ({ valid: true }),
};

const Register = ({ navigation }) => {
  const { register, isLoading, error } = useAuth();
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    marketingOptIn: false,
  });
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
  }, [step]);

  const validator = createValidator(schema);

  const handleNextStep = async () => {
    const validation = await validator(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      setShowToast(true);
      return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      const key = generateIdempotencyKey('register', formData.email, new Date());
      try {
        await register({ ...formData, idempotencyKey: key });
        navigation.replace('MainTabs');
      } catch (err) {
        setShowToast(true);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <TextInput
              style={[styles.input, formErrors.name && styles.inputError, { backgroundColor: safeColors.progressBackground, color: safeColors.primaryText }]}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              accessibilityLabel="Full name input"
            />
            {formErrors.name && <Text style={[styles.errorText, { color: safeColors.error }]}>{formErrors.name}</Text>}
            <TextInput
              style={[styles.input, formErrors.email && styles.inputError, { backgroundColor: safeColors.progressBackground, color: safeColors.primaryText }]}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel="Email input"
            />
            {formErrors.email && <Text style={[styles.errorText, { color: safeColors.error }]}>{formErrors.email}</Text>}
          </>
        );
      case 1:
        return (
          <>
            <TextInput
              style={[styles.input, formErrors.password && styles.inputError, { backgroundColor: safeColors.progressBackground, color: safeColors.primaryText }]}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              accessibilityLabel="Password input"
            />
            {formErrors.password && <Text style={[styles.errorText, { color: safeColors.error }]}>{formErrors.password}</Text>}
            <TextInput
              style={[styles.input, formErrors.confirmPassword && styles.inputError, { backgroundColor: safeColors.progressBackground, color: safeColors.primaryText }]}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry
              accessibilityLabel="Confirm password input"
            />
            {formErrors.confirmPassword && <Text style={[styles.errorText, { color: safeColors.error }]}>{formErrors.confirmPassword}</Text>}
          </>
        );
      case 2:
        return (
          <>
            <View style={styles.switchContainer}>
              <Text style={[styles.label, { color: safeColors.primaryText }]}>Accept Terms</Text>
              <Switch
                value={formData.acceptTerms}
                onValueChange={(value) => handleInputChange('acceptTerms', value)}
                trackColor={{ false: safeColors.progressBackground, true: safeColors.successGreen }}
                thumbColor={safeColors.cardBackground}
                accessibilityLabel="Accept terms switch"
              />
            </View>
            {formErrors.acceptTerms && <Text style={[styles.errorText, { color: safeColors.error }]}>{formErrors.acceptTerms}</Text>}
            <View style={styles.switchContainer}>
              <Text style={[styles.label, { color: safeColors.primaryText }]}>Marketing Emails</Text>
              <Switch
                value={formData.marketingOptIn}
                onValueChange={(value) => handleInputChange('marketingOptIn', value)}
                trackColor={{ false: safeColors.progressBackground, true: safeColors.successGreen }}
                thumbColor={safeColors.cardBackground}
                accessibilityLabel="Marketing opt-in switch"
              />
            </View>
          </>
        );
      case 3:
        return (
          <Text style={[styles.infoText, { color: safeColors.primaryText }]}>
            Please check your email to verify your account. Click "Finish" to proceed.
          </Text>
        );
      case 4:
        return (
          <Text style={[styles.infoText, { color: safeColors.primaryText }]}>
            Welcome to Habit Tracker! You're all set to start building habits.
          </Text>
        );
      default:
        return null;
    }
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateX: fadeAnim.interpolate({
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
        <Text style={[styles.title, { color: safeColors.primaryText }]}>{steps[step]}</Text>
        <View style={styles.progressBar}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= step ? { backgroundColor: safeColors.primaryOrange } : { backgroundColor: safeColors.progressBackground },
              ]}
            />
          ))}
        </View>
        {renderStep()}
        <Button
          variant="primary"
          title={step === steps.length - 1 ? 'Finish' : 'Next'}
          onPress={handleNextStep}
          loading={isLoading}
          style={styles.button}
          icon="arrow-forward"
          iconPosition="right"
        />
        {step > 0 && (
          <Button
            variant="text"
            title="Back"
            onPress={() => setStep(step - 1)}
            style={styles.linkButton}
          />
        )}
      </Animated.View>
      {showToast && (
        <Toast
          type="error"
          message={error || 'Registration failed'}
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
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  label: {
    ...typography.styles.body,
    color: colors.light?.primaryText || fallbackColors.primaryText,
  },
  infoText: {
    ...typography.styles.body,
    textAlign: 'center',
    marginBottom: layout.spacing.md,
  },
});

export default Register;