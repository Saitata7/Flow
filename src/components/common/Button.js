// common/Button.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { colors, typography, layout, spacing, shadows, radius } from '../../../styles';

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
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.light.primaryOrangeVariants.light : colors.light.primaryOrange,
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
          backgroundColor: disabled ? colors.light.primaryOrangeVariants.light : colors.light.primaryOrange,
          borderColor: 'transparent',
          textColor: colors.light.cardBackground,
          borderRadius: radius.circle,
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          height: layout.button.smallHeight, 
          paddingHorizontal: spacing.sm, 
          fontSize: typography.sizes.footnote 
        };
      case 'large':
        return { 
          height: 56, 
          paddingHorizontal: spacing.lg, 
          fontSize: typography.sizes.title3 
        };
      default: // medium
        return { 
          height: layout.button.standardHeight, 
          paddingHorizontal: spacing.md, 
          fontSize: typography.sizes.headline 
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
      borderWidth: variant === 'secondary' ? 1 : 0,
      ...sizeStyles,
    },
    style,
  ];

  const textStyle = [
    styles.text,
    {
      color: variantStyles.textColor,
      fontSize: sizeStyles.fontSize,
    },
  ];

  const IconComponent = icon ? <Text style={[textStyle, { marginHorizontal: spacing.xs }]}>{icon}</Text> : null;

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
  variant: PropTypes.oneOf(['primary', 'secondary', 'text', 'icon', 'fab']),
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
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.squircle,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}),
    ...shadows.buttonShadow,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: typography.fonts.family.medium,
    fontWeight: typography.weights.medium,
  },
});

export default Button;

// Example Usage:
// <Button variant="primary" size="medium" title="Add Habit" onPress={() => console.log('Pressed')} />