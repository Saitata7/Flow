// common/Button.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { colors, typography, layout } from '../../../styles';

const Button = ({
  variant = 'primary',
  size = 'medium',
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style = {},
  testID,
  selected = false,
}) => {
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 10 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPressed(true);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
    setPressed(false);
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      Haptics.selectionAsync();
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getVariantStyles = () => {
    // Handle selected state for any variant
    if (selected) {
      return {
        backgroundColor: disabled ? colors.light.secondaryText : colors.light.primaryOrange,
        borderColor: disabled ? colors.light.secondaryText : colors.light.primaryOrange,
        textColor: colors.light.cardBackground,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.light.secondaryText : colors.light.primaryOrange,
          borderColor: 'transparent',
          textColor: colors.light.cardBackground,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? colors.light.progressBackground : colors.light.cardBackground,
          borderColor: colors.light.primaryOrange,
          textColor: colors.light.primaryOrange,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: disabled ? colors.light.tertiaryText : colors.light.primaryOrange,
        };
      case 'icon':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: disabled ? colors.light.tertiaryText : colors.light.primaryOrange,
        };
      case 'fab':
        return {
          backgroundColor: disabled ? colors.light.secondaryText : colors.light.primaryOrange,
          borderColor: 'transparent',
          textColor: colors.light.cardBackground,
          borderRadius: 20,
        };
      case 'destructive':
        return {
          backgroundColor: disabled ? colors.light.secondaryText : colors.light.error,
          borderColor: 'transparent',
          textColor: colors.light.cardBackground,
        };
      case 'toggle':
        return {
          backgroundColor: disabled ? colors.light.progressBackground : colors.light.background,
          borderColor: colors.light.primaryOrange,
          textColor: colors.light.primaryOrange,
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          height: 36, // components.button.small.height
          paddingHorizontal: layout.spacing.base, 
          fontSize: typography.caption.size 
        };
      case 'large':
        return { 
          height: 48, // components.button.primary.height
          paddingHorizontal: layout.spacing.lg, 
          fontSize: typography.body.size 
        };
      default: // medium
        return { 
          height: 48, // components.button.primary.height
          paddingHorizontal: layout.spacing.lg, 
          fontSize: typography.body.size 
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyle = [
    styles.button,
    {
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled || loading ? 0.4 : 1,
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variant === 'secondary' || variant === 'toggle' ? 1 : 0,
      ...sizeStyles,
      // Custom styling for toggle variant
      ...(variant === 'toggle' ? {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.sm,
        paddingVertical: layout.spacing.xs,
        borderRadius: layout.radii.small,
        gap: layout.spacing.xs,
        justifyContent: 'center',
        ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}),
      } : {}),
    },
    style,
  ];

  const textStyle = [
    styles.text,
    {
      color: variantStyles.textColor,
      fontSize: sizeStyles.fontSize,
      // Custom text styling for toggle variant
      ...(variant === 'toggle' ? {
        ...typography.styles.caption1,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      } : {}),
    },
  ];

  const IconComponent = icon ? <Text style={[textStyle, { marginHorizontal: layout?.spacing?.xs || 4 }]}>{icon}</Text> : null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
    >
      <Animated.View style={[buttonStyle, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color={variantStyles.textColor} />
        ) : (
          <View style={styles.content}>
            {iconPosition === 'left' && IconComponent}
            <Text style={textStyle}>{title}</Text>
            {iconPosition === 'right' && IconComponent}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'text', 'icon', 'fab', 'destructive', 'toggle']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  title: PropTypes.string,
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool,
  style: PropTypes.object,
  testID: PropTypes.string,
  selected: PropTypes.bool,
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: layout.radii.base, // Use radii tokens instead of old borderRadius
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}),
    ...layout.elevation.low, // Use elevation tokens instead of shadows
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '500',
  },
});

export default Button;

// Example Usage:
// <Button variant="primary" size="medium" title="Add Habit" onPress={() => console.log('Pressed')} />