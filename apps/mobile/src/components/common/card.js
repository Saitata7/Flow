// common/Card.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { colors, layout } from '../../../styles';

const Card = ({ 
  children, 
  style = {}, 
  variant = 'default',
  padding = 'md',
  margin = 'sm',
  elevated = false,
  backgroundColor = colors.light.cardBackground
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'xs': return layout.spacing.xs;
      case 'sm': return layout.spacing.sm;
      case 'lg': return layout.spacing.lg;
      case 'xl': return layout.spacing.xl;
      default: return layout.spacing.md;
    }
  };

  const getMargin = () => {
    switch (margin) {
      case 'xs': return layout.spacing.xs;
      case 'sm': return layout.spacing.sm;
      case 'md': return layout.spacing.md;
      case 'lg': return layout.spacing.lg;
      case 'xl': return layout.spacing.xl;
      case 'none': return 0;
      default: return layout.spacing.sm;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          ...layout.elevation.high,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.light.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.light.surface,
        };
      default:
        return {
          // No shadows for default variant
        };
    }
  };

  const cardStyle = [
    styles.card,
    getVariantStyles(),
    {
      padding: getPadding(),
      marginVertical: getMargin(),
      backgroundColor: backgroundColor,
    },
    style,
  ];

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.radii.large,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}),
  },
});

export default Card;