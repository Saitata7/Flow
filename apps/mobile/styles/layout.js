// styles/layout.js
// Layout system for Flow Tracker app with iOS squircle focus
// 8pt grid for consistency, safe areas for notch/full-screen
// Squircle: Use react-native-super-ellipse-mask for authentic curves (install via yarn add react-native-super-ellipse-mask)
// Shadows optimized for React Native (low opacity to prevent lag)
// Usage: Compose like { padding: layout.spacing.md, ...layout.card }

import { Platform, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const layout = {
  // Squircle Implementation
  squircle: {
    // Approximation for standard React Native
    borderRadius: 22, // Basic fallback
    // Pro Implementation: Wrap components in <SuperEllipseMask curvature={0.1} /> from react-native-super-ellipse-mask
    // Curvature: 0.05-0.1 for subtle squircles, 0.2 for aggressive (iOS icons ~0.21875)
    // Note: For true super ellipse, use library; avoid high borderRadius on large views for performance
  },

  // Spacing Scale (8pt Modular Grid)
  spacing: {
    xs: 4, // Tiny gaps, icons
    sm: 8, // Small paddings, badge spacing
    md: 16, // Standard card padding, sections
    lg: 24, // Major vertical spacing, flow groups
    xl: 32, // Screen sections, headers
    xxl: 48, // Top-level gaps, empty states
  },

  // Card Specifications
  card: {
    marginHorizontal: 16, // Screen edge padding (iOS safe)
    marginVertical: 8, // Vertical card stacking
    paddingHorizontal: 20, // Internal content padding
    paddingVertical: 16,
    borderRadius: 22, // Squircle approx
    width: screenWidth - 32, // Full-width minus margins
  },

  // Shadow System (iOS-Style Depth)
  shadows: {
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3, // Android equivalent
    },
    elevatedShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    buttonShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
  },

  // Button Dimensions
  button: {
    standardHeight: 50, // Primary buttons
    smallHeight: 36, // Secondary
    iconSize: 44, // Touch target (iOS min)
    pillRadius: 25, // Rounded pills
  },

  // Flow Streak Badges
  streakBadge: {
    size: 32, // Width/height
    spacing: 4, // Between badges
    borderRadius: 16, // Circle
  },

  // Screen Layout
  screen: {
    paddingHorizontal: 16, // Global content inset
    paddingTop: Platform.OS === 'ios' ? 64 : 20, // Status bar compensation
    paddingBottom: 20, // Bottom safe area
  },

  // Tab Bar Spacing
  tabSpacing: 16, // Extra spacing above tab bar as per cursor rules

  // Additional Flow Tracker Layouts
  calendar: {
    daySize: 40, // Calendar day cells
    daySpacing: 8,
    selectedBorderWidth: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
};

// Pro Tip: For responsive, use percentage widths or react-native-responsive-screen