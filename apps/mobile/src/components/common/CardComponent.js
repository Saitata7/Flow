// common/CardComponent.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { colors, layout, typography } from '../../../styles';

const CardComponent = ({ 
  children, 
  variant = 'elevated', 
  padding = 'md', 
  margin = 'sm',
  style = {},
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.light.cardBackground,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        };
      case 'flat':
        return {
          backgroundColor: colors.light.cardBackground,
          borderWidth: 1,
          borderColor: colors.light.border,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.light.border,
        };
      default:
        return {
          backgroundColor: colors.light.cardBackground,
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'xs':
        return { padding: layout.spacing.xs };
      case 'sm':
        return { padding: layout.spacing.sm };
      case 'md':
        return { padding: layout.spacing.md };
      case 'lg':
        return { padding: layout.spacing.lg };
      case 'xl':
        return { padding: layout.spacing.xl };
      default:
        return { padding: layout.spacing.md };
    }
  };

  const getMarginStyles = () => {
    switch (margin) {
      case 'none':
        return { margin: 0 };
      case 'xs':
        return { margin: layout.spacing.xs };
      case 'sm':
        return { margin: layout.spacing.sm };
      case 'md':
        return { margin: layout.spacing.md };
      case 'lg':
        return { margin: layout.spacing.lg };
      case 'xl':
        return { margin: layout.spacing.xl };
      default:
        return { margin: layout.spacing.sm };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        getPaddingStyles(),
        getMarginStyles(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.radii.squircle,
    overflow: 'hidden',
  },
});

export default CardComponent;
