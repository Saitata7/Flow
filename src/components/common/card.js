// common/card.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';
import { colors, layout, spacing, shadows, radius } from '../../../styles';

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
      case 'xs': return spacing.xs;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      case 'xl': return spacing.xl;
      default: return spacing.md;
    }
  };

  const getMargin = () => {
    switch (margin) {
      case 'xs': return spacing.xs;
      case 'sm': return spacing.sm;
      case 'md': return spacing.md;
      case 'lg': return spacing.lg;
      case 'xl': return spacing.xl;
      case 'none': return 0;
      default: return spacing.sm;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          ...layout.card,
          ...shadows.elevatedShadow,
        };
      case 'outlined':
        return {
          ...layout.card,
          borderWidth: 1,
          borderColor: colors.light.tertiaryText,
        };
      case 'filled':
        return {
          ...layout.card,
          backgroundColor: colors.light.progressBackground,
        };
      default:
        return {
          ...layout.card,
          ...(elevated ? shadows.elevatedShadow : shadows.cardShadow),
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
    borderRadius: radius.squircle,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}),
  },
});

export default Card;

// Example Usage:
// <Card variant="elevated" padding="lg" margin="md">
//   <Text>Habit Content</Text>
// </Card>