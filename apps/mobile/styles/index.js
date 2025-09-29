// styles/index.js
import { StyleSheet, Platform } from 'react-native';
import { typography } from './typography';
import { layout } from './layout';
import { colors, hslUtils } from './colors';

// Export all styles
export { colors };
export { typography };
export { layout };
export { hslUtils };

// Common styles - using direct hex values to avoid any dependency issues
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#F7BA53',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 17,
    color: '#3E3E3E',
  },
  
  // Flow Grid Icon Styles
  flowGridCompletedIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#4DB34D', // Solid green circle
    borderRadius: 6,
  },
  flowGridMissedIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#FF6961', // Solid red circle
    borderRadius: 6,
  },
  flowGridPartialIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#F2A005', // Solid orange circle
    borderRadius: 6,
  },
});

// Theme hook for dynamic theming
export const useAppTheme = () => {
  return {
    colors: colors.light,
    isDark: false, // For now, always light theme
    typography,
    layout,
  };
};

export default {
  colors,
  typography,
  layout,
  hslUtils,
  commonStyles,
  useAppTheme,
};