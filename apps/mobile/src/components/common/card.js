// common/card.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';
import { colors, layout } from '../../../styles';

const Card = ({ 
  children, 
  style = {}, 
  variant = 'default',
  padding = 'md',
  margin = 'sm',
  elevated = false 
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
          ...layout.shadows.large,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.light.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.light.progressBackground,
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
    },
    style,
  ];

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'filled']),
  padding: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  margin: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'none']),
  elevated: PropTypes.bool,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}),
  },
});

export default Card;

// Example Usage:
// <Card variant="elevated" padding="lg" margin="md">
//   <Text>Habit Content</Text>
// </Card>