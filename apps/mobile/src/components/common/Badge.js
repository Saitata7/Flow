// src/components/common/Badge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, layout } from '../../../styles';

const Badge = ({ 
  count, 
  size = 'small', 
  color = colors.light.primaryOrange,
  textColor = colors.light.cardBackground,
  maxCount = 99 
}) => {
  if (!count || count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  const sizeStyles = {
    small: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      fontSize: 10,
    },
    medium: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      fontSize: 12,
    },
    large: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: color,
        minWidth: currentSize.minWidth,
        height: currentSize.height,
        borderRadius: currentSize.borderRadius,
      }
    ]}>
      <Text style={[
        styles.badgeText,
        {
          color: textColor,
          fontSize: currentSize.fontSize,
        }
      ]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    ...layout.elevation.low,
  },
  badgeText: {
    ...typography.styles.caption1,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Badge;
