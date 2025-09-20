// styles/index.js
import { StyleSheet, Platform } from 'react-native';
import { typography } from './typography';

// Color palette
export const colors = {
  light: {
    background: '#FFF0E6',
    primaryOrange: '#FF9500',
    placeholderText: '#A0A0A0',
    cardBackground: '#FFFFFF',
    primaryText: '#1D1D1F',
    secondaryText: '#86868B',
    tertiaryText: '#A0A0A0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
    flowCompleted: '#34C759',
    flowMissed: '#FF3B30',
    primaryOrangeVariants: {
      light: '#FFB84D',
      dark: '#FF8C00',
      vibrant: '#FF7A00',
    },
    infoVariants: {
      light: '#E3F2FD',
    },
    progressBackground: '#E5E5EA',
    border: '#D1D1D6',
    accent: '#007AFF',
  },
  dark: {
    background: '#1C1C1E',
    primaryOrange: '#FF9500',
    placeholderText: '#8E8E93',
    cardBackground: '#2C2C2E',
    primaryText: '#FFFFFF',
    secondaryText: '#8E8E93',
    tertiaryText: '#8E8E93',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9500',
    info: '#0A84FF',
    flowCompleted: '#30D158',
    flowMissed: '#FF453A',
    primaryOrangeVariants: {
      light: '#FFB84D',
      dark: '#FF8C00',
      vibrant: '#FF7A00',
    },
    infoVariants: {
      light: '#1A237E',
    },
    progressBackground: '#3A3A3C',
    border: '#38383A',
    accent: '#0A84FF',
  },
};

// Export typography from separate file
export { typography };

// Layout spacing
export const layout = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    elevatedShadow: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  screen: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 64 : 20,
    paddingBottom: 20,
  },
  squircle: {
    borderRadius: 22,
  },
  button: {
    pillRadius: 25,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
};

// Common styles
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    ...layout.shadows.small,
  },
  button: {
    backgroundColor: colors.light.primaryOrange,
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.light.cardBackground,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    fontSize: 17,
    color: colors.light.primaryText,
  },
});

// Theme hook for dynamic theming
export const useAppTheme = () => {
  // For now, return light theme
  // This can be enhanced to use ThemeContext later
  return {
    colors: colors.light,
    typography: typography.styles,
    layout,
  };
};

export default {
  colors,
  typography,
  layout,
  commonStyles,
  useAppTheme,
};