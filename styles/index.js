// styles/index.js
// Central theme exporter for Flow Tracker app
// Integrates colors, typography, layout with StyleSheet for optimization
// Includes utilities and component presets for consistency
// Usage: import { colors, typography, layout, spacing, shadows } from '../styles';

import { StyleSheet, Platform, PixelRatio, useColorScheme, Dimensions } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';
import { layout } from './layout';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Re-export individual modules for direct imports
export { colors, typography, layout };

// Enhanced theme object with better organization
export const theme = {
  colors,
  typography,
  layout,
  // Component Style Presets (Pre-composed with StyleSheet)
  componentStyles: StyleSheet.create({
    // Card Components
    card: {
      backgroundColor: colors.light.cardBackground,
      ...layout.card,
      ...layout.shadows.cardShadow,
    },
    cardElevated: {
      backgroundColor: colors.light.cardBackground,
      ...layout.card,
      ...layout.shadows.elevatedShadow,
    },
    
    // Button Components
    primaryButton: {
      backgroundColor: colors.light.primaryOrange,
      height: layout.button.standardHeight,
      borderRadius: layout.squircle.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      ...layout.shadows.buttonShadow,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.light.primaryOrange,
      backgroundColor: 'transparent',
      height: layout.button.smallHeight,
      borderRadius: layout.button.pillRadius,
    },
    textButton: {
      backgroundColor: 'transparent',
      height: layout.button.smallHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    // Input Components
    textInput: {
      height: 50,
      borderWidth: 1,
      borderColor: colors.light.progressBackground,
      borderRadius: 12,
      paddingHorizontal: layout.spacing.md,
      fontSize: typography.sizes.body,
      fontFamily: typography.fonts.family.regular,
      backgroundColor: colors.light.cardBackground,
    },
    textInputFocused: {
      borderColor: colors.light.primaryOrange,
      borderWidth: 2,
    },
    
    // Navigation Components
    navigationBar: {
      height: 44,
      backgroundColor: colors.light.cardBackground,
      borderBottomWidth: PixelRatio.getPixelSizeForLayoutSize(0.5),
      borderBottomColor: colors.light.tertiaryText,
    },
    
    // Flow-specific Components
    flowCard: {
      backgroundColor: colors.light.cardBackground,
      ...layout.card,
      ...layout.shadows.cardShadow,
    },
    streakBadge: {
      width: layout.streakBadge.size,
      height: layout.streakBadge.size,
      borderRadius: layout.streakBadge.borderRadius,
      backgroundColor: colors.light.badgeBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: layout.streakBadge.spacing,
      ...layout.shadows.streakBadge,
    },
    progressBar: {
      height: layout.progressBar.height,
      borderRadius: layout.progressBar.borderRadius,
      backgroundColor: colors.light.progressBackground,
    },
    progressFill: {
      height: layout.progressBar.height,
      borderRadius: layout.progressBar.borderRadius,
      backgroundColor: colors.light.progressFill,
    },
  }),
};

// Layout Helper Functions
export const spacing = {
  xs: layout.spacing.xs,
  sm: layout.spacing.sm,
  md: layout.spacing.md,
  lg: layout.spacing.lg,
  xl: layout.spacing.xl,
  xxl: layout.spacing.xxl,
};

export const shadows = layout.shadows;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  squircle: layout.squircle.borderRadius,
  pill: layout.button.pillRadius,
  circle: 50,
};

// Typography Helper Functions
export const typo = {
  h1: typography.styles.flowTitle,
  h2: {
    ...typography.styles.flowTitle,
    fontSize: typography.sizes.title2,
  },
  h3: {
    ...typography.styles.flowTitle,
    fontSize: typography.sizes.title3,
  },
  body: typography.styles.noteText,
  caption: typography.styles.timestamp,
  button: {
    fontFamily: typography.fonts.family.medium,
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.medium,
  },
  label: {
    fontFamily: typography.fonts.family.medium,
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
  },
};

// Layout Helper Functions
export const flexCenter = {
  justifyContent: 'center',
  alignItems: 'center',
};

export const flexRow = {
  flexDirection: 'row',
  alignItems: 'center',
};

export const flexRowBetween = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const container = {
  flex: 1,
  paddingHorizontal: layout.spacing.md,
};

export const screen = {
  flex: 1,
  backgroundColor: colors.light.background,
  ...layout.screen,
};

// Utility Functions
export const withOpacity = (color, opacity) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const responsiveFontSize = (size) => {
  return PixelRatio.roundToNearestPixel(size * (screenWidth / 375));
};

export const responsiveWidth = (percentage) => {
  return (screenWidth * percentage) / 100;
};

export const responsiveHeight = (percentage) => {
  return (screenHeight * percentage) / 100;
};

export const platformStyle = (iosStyle, androidStyle) => {
  return Platform.OS === 'ios' ? iosStyle : androidStyle;
};

// Theme Switching Hook
export const useAppTheme = () => {
  const scheme = useColorScheme() || 'light';
  return {
    ...theme,
    colors: theme.colors[scheme],
    shadows: theme.layout.shadows,
    isDark: scheme === 'dark',
  };
};

// Color Helper Functions
export const getColor = (colorPath, isDark = false) => {
  const path = colorPath.split('.');
  let color = isDark ? colors.dark : colors.light;
  
  for (const key of path) {
    color = color[key];
    if (!color) return colors.light.primaryText; // Fallback
  }
  
  return color;
};

// Common Style Combinations
export const commonStyles = StyleSheet.create({
  // Text Styles
  heading: {
    ...typo.h1,
    color: colors.light.primaryText,
    marginBottom: spacing.md,
  },
  subheading: {
    ...typo.h2,
    color: colors.light.primaryText,
    marginBottom: spacing.sm,
  },
  body: {
    ...typo.body,
    color: colors.light.primaryText,
  },
  caption: {
    ...typo.caption,
    color: colors.light.secondaryText,
  },
  
  // Layout Styles
  centerContainer: {
    ...container,
    ...flexCenter,
  },
  rowContainer: {
    ...flexRow,
    marginVertical: spacing.sm,
  },
  spaceBetween: {
    ...flexRowBetween,
    marginVertical: spacing.sm,
  },
  
  // Card Styles
  card: {
    ...theme.componentStyles.card,
    marginVertical: spacing.sm,
  },
  cardContent: {
    padding: spacing.md,
  },
  
  // Button Styles
  primaryButton: {
    ...theme.componentStyles.primaryButton,
    marginVertical: spacing.sm,
  },
  secondaryButton: {
    ...theme.componentStyles.secondaryButton,
    marginVertical: spacing.sm,
  },
  
  // Input Styles
  input: {
    ...theme.componentStyles.textInput,
    marginVertical: spacing.sm,
  },
  inputLabel: {
    ...typo.label,
    color: colors.light.primaryText,
    marginBottom: spacing.xs,
  },
  
  // Status Styles
  success: {
    color: colors.light.success,
  },
  error: {
    color: colors.light.error,
  },
  warning: {
    color: colors.light.warning,
  },
  info: {
    color: colors.light.info,
  },
});

// Export everything for easy importing
export default {
  colors,
  typography,
  layout,
  spacing,
  shadows,
  radius,
  typo,
  flexCenter,
  flexRow,
  flexRowBetween,
  container,
  screen,
  withOpacity,
  responsiveFontSize,
  responsiveWidth,
  responsiveHeight,
  platformStyle,
  useAppTheme,
  getColor,
  commonStyles,
  theme,
};