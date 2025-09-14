// common/Icon.js
import React from 'react';
import { TouchableOpacity, View, Text, Platform, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { colors, typography, layout } from '../../../styles';

const Icon = ({
  name,
  size = 'medium',
  color = colors.light.primaryText,
  library = 'ionicons',
  style = {},
  onPress,
  disabled = false,
  badge = 0,
  testID,
}) => {
  const getSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      case 'xl': return 40;
      default: return 24;
    }
  };

  const iconSize = getSize();

  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.selectionAsync();
      onPress();
    }
  };

  const getIconColor = () => {
    return disabled ? colors.light.secondaryText : color;
  };

  const IconComponent = <Ionicons name={name} size={iconSize} color={getIconColor()} />;

  const containerStyle = [
    styles.container,
    {
      minWidth: iconSize + layout.spacing.sm,
      minHeight: iconSize + layout.spacing.sm,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={containerStyle}
        testID={testID}
      >
        {IconComponent}
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {IconComponent}
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['small', 'medium', 'large', 'xl'])]),
  color: PropTypes.string,
  library: PropTypes.oneOf(['sf-symbols', 'ionicons', 'feather', 'custom']),
  style: PropTypes.object,
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
  badge: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  testID: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.light.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.light.cardBackground,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Icon;

// Example Usage:
// <Icon name="add" size="medium" color={colors.light.primaryOrange} onPress={() => console.log('Icon pressed')} />