// common/Toast.js
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { colors, typography, layout } from '../../../styles';

const Toast = ({
  type = 'info',
  message,
  description,
  duration = 3000,
  position = 'bottom',
  action,
  icon,
  backgroundColor,
  textColor,
  onDismiss,
  persistent = false,
  testID,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position === 'bottom' ? 100 : -100);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 15 });
    if (!persistent) {
      const timer = setTimeout(handleDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    opacity.value = withTiming(0, { duration: 300 });
    translateY.value = withSpring(position === 'bottom' ? 100 : -100, { damping: 15 });
    setTimeout(onDismiss, 300);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationY) > 50) {
        handleDismiss();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return { 
          backgroundColor: colors.light.success, 
          textColor: colors.light.cardBackground, 
          icon: '✓' 
        };
      case 'error':
        return { 
          backgroundColor: colors.light.error, 
          textColor: colors.light.cardBackground, 
          icon: '✕' 
        };
      case 'warning':
        return { 
          backgroundColor: colors.light.warning, 
          textColor: colors.light.cardBackground, 
          icon: '⚠' 
        };
      case 'info':
        return { 
          backgroundColor: colors.light.info, 
          textColor: colors.light.cardBackground, 
          icon: 'ℹ' 
        };
      default:
        return { 
          backgroundColor: backgroundColor || colors.light.info, 
          textColor: textColor || colors.light.cardBackground, 
          icon: icon || 'ℹ' 
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <GestureDetector gesture={pan}>
      <Animated.View 
        style={[
          styles.toast, 
          { [position]: 50 }, 
          animatedStyle, 
          { backgroundColor: typeStyles.backgroundColor }
        ]}
        testID={testID}
      >
        <Text style={[styles.icon, { color: typeStyles.textColor }]}>
          {typeStyles.icon}
        </Text>
        <View style={styles.content}>
          <Text style={[styles.message, { color: typeStyles.textColor }]}>
            {message}
          </Text>
          {description && (
            <Text style={[styles.description, { color: typeStyles.textColor }]}>
              {description}
            </Text>
          )}
        </View>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={[styles.action, { color: typeStyles.textColor }]}>
              {action.text}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

Toast.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'custom']),
  message: PropTypes.string.isRequired,
  description: PropTypes.string,
  duration: PropTypes.number,
  position: PropTypes.oneOf(['top', 'center', 'bottom']),
  action: PropTypes.shape({ 
    text: PropTypes.string, 
    onPress: PropTypes.func 
  }),
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  onDismiss: PropTypes.func.isRequired,
  persistent: PropTypes.bool,
  testID: PropTypes.string,
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.xl,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}),
    ...layout.shadows.large,
    position: 'absolute',
    left: layout.spacing.md,
    right: layout.spacing.md,
  },
  icon: {
    fontSize: 20,
    marginRight: layout.spacing.sm,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 17,
    fontWeight: '600',
  },
  description: {
    fontSize: 17,
    marginTop: layout.spacing.xs,
    opacity: 0.9,
  },
  action: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: layout.spacing.sm,
  },
});

export default Toast;

// Example Usage:
// <Toast type="success" message="Habit Completed" onDismiss={() => console.log('Dismissed')} />