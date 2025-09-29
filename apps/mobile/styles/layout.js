// styles/layout.js
// Layout system for Flow mobile app with squircle focus
// Production-grade spacing, elevation, and component tokens
// Follows 4px base unit system and accessibility standards

import { Platform, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Layout Utility Functions
 * Base unit = 4px for consistent spacing calculations
 */
export const layoutUtils = {
  // Convert spacing units to pixels
  spacing: (unit) => unit * 4, // Base unit = 4px
  
  // Calculate responsive dimensions
  responsiveWidth: (percentage) => (screenWidth * percentage) / 100,
  
  // Calculate safe area adjustments
  safeAreaTop: Platform.OS === 'ios' ? 44 : 24,
  safeAreaBottom: Platform.OS === 'ios' ? 34 : 16,
};

// Spacing Scale (4px base unit system)
export const spacing = {
  xs: 4,    // 1 unit - micro gaps, icon spacing
  sm: 8,    // 2 units - small paddings, badge spacing  
  md: 12,   // 3 units - component internal spacing
  base: 16, // 4 units - standard padding, sections
  lg: 20,   // 5 units - medium spacing
  xl: 24,   // 6 units - major vertical spacing
  x2l: 32,  // 8 units - screen sections, headers
  x3l: 40,  // 10 units - large gaps
  x4l: 48,  // 12 units - top-level gaps
  x5l: 64,  // 16 units - empty states, major spacing
};

// Border Radius & Geometry (Squircle System)
export const radii = {
  small: 8,     // Input fields, small buttons
  base: 12,     // Standard buttons, cards
  squircle: 18, // Global squircle for cards, FAB, major surfaces
  large: 28,    // Super rounded banners, hero CTAs
  circle: 50,   // Circular elements (badges, avatars)
};

// Elevation & Shadow System
export const elevation = {
  low: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  },
  medium: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.09,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  },
  high: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
  },
};

// Component Specifications
export const components = {
  // Button specifications
  button: {
    primary: {
      height: 48,
      borderRadius: radii.base,
      paddingHorizontal: spacing.lg,
      iconSize: 20,
      minTouchTarget: 44,
    },
    secondary: {
      height: 48,
      borderRadius: radii.base,
      paddingHorizontal: spacing.lg,
      borderWidth: 2,
      iconSize: 20,
      minTouchTarget: 44,
    },
    small: {
      height: 36,
      borderRadius: radii.small,
      paddingHorizontal: spacing.base,
      iconSize: 16,
      minTouchTarget: 44,
    },
  },
  
  // Input specifications
  input: {
    height: 48,
    borderRadius: radii.base,
    padding: spacing.md,
    labelGap: spacing.sm, // Gap between label and input
    minTouchTarget: 44,
  },
  
  // Card specifications
  card: {
    padding: 16,
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 'low',
  },
  
  // FAB specifications
  fab: {
    size: 56,
    borderRadius: radii.large,
    iconSize: 24,
    elevation: elevation.high,
  },
  
  // Bottom tab specifications
  bottomTab: {
    height: 64,
    iconSize: 26,
    labelSize: 12,
    paddingBottom: spacing.md,
    minTouchTarget: 44,
  },
  
  // Date grid specifications
  dateGrid: {
    circleDiameter: 28,
    circleBorderWidth: 2,
    columnGap: spacing.sm, // Gap between flow list and date grid
    innerGap: spacing.sm, // Inner gap within date grid
  },
  
  // Flow card layout specifications
  flowCard: {
    leftColumnWidth: '30%', // Flow list column
    rightColumnWidth: '70%', // Date grid column
    padding: 16,
    borderRadius: 18,
    elevation: 'low',
  },
};

// Screen Layout Specifications
export const screen = {
  // Safe area margins
  safeAreaTop: layoutUtils.safeAreaTop,
  safeAreaBottom: layoutUtils.safeAreaBottom,
  
  // Content margins
  contentMargin: 16, // 16px side margins
  tabletMargin: 24, // 24px for tablets
  
  // Grid system
  singleColumn: {
    marginHorizontal: 16,
    maxWidth: screenWidth - 32,
  },
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
};

// Motion & Animation Specifications
export const motion = {
  durations: {
    micro: 120,    // Tap interactions
    small: 200,    // Modal open, small slides
    medium: 280,   // Medium transitions
    large: 320,    // Screen transitions
    xlarge: 420,   // Complex animations
  },
  
  // Spring configurations
  spring: {
    damping: 0.8,
    stiffness: 100,
    mass: 1,
  },
  
  // Scale animations
  scale: {
    press: 0.98,   // Button press scale
    hover: 1.02,   // Hover scale (if supported)
  },
};

// Main layout object export (includes all tokens)
export const layout = {
  spacing: {
    xs: 4,    // 1 unit - micro gaps, icon spacing
    sm: 8,    // 2 units - small paddings, badge spacing  
    md: 12,   // 3 units - component internal spacing
    base: 16, // 4 units - standard padding, sections
    lg: 20,   // 5 units - medium spacing
    xl: 24,   // 6 units - major vertical spacing
    x2l: 32,  // 8 units - screen sections, headers
    x3l: 40,  // 10 units - large gaps
    x4l: 48,  // 12 units - top-level gaps
    x5l: 64,  // 16 units - empty states, major spacing
  },
  radii: {
    small: 8,     // Input fields, small buttons
    base: 12,     // Standard buttons, cards
    squircle: 18, // Global squircle for cards, FAB, major surfaces
    large: 28,    // Super rounded banners, hero CTAs
    circle: 50,   // Circular elements (badges, avatars)
  },
  elevation: {
    low: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    },
    medium: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.09,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    },
    high: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    },
  },
  components: {
    button: {
      primary: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 20,
        iconSize: 20,
        minTouchTarget: 44,
      },
      secondary: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 20,
        borderWidth: 2,
        iconSize: 20,
        minTouchTarget: 44,
      },
      small: {
        height: 36,
        borderRadius: 8,
        paddingHorizontal: 16,
        iconSize: 16,
        minTouchTarget: 44,
      },
    },
    input: {
      height: 48,
      borderRadius: 12,
      padding: 12,
      labelGap: 8,
      minTouchTarget: 44,
    },
    card: {
      padding: 16,
      borderRadius: 18,
      marginHorizontal: 16,
      marginVertical: 8,
      elevation: 'low',
    },
    fab: {
      size: 56,
      borderRadius: 28,
      iconSize: 24,
      elevation: 'high',
    },
    bottomTab: {
      height: 64,
      iconSize: 26,
      labelSize: 12,
      paddingBottom: 12,
      minTouchTarget: 44,
    },
    dateGrid: {
      circleDiameter: 28,
      circleBorderWidth: 2,
      columnGap: 8,
      innerGap: 8,
    },
    flowCard: {
      leftColumnWidth: '30%',
      rightColumnWidth: '70%',
      padding: 16,
      borderRadius: 18,
      elevation: 'low',
    },
  },
  screen: {
    safeAreaTop: Platform.OS === 'ios' ? 44 : 24,
    safeAreaBottom: Platform.OS === 'ios' ? 34 : 16,
    contentMargin: 16,
    tabletMargin: 24,
    singleColumn: {
      marginHorizontal: 16,
      maxWidth: screenWidth - 32,
    },
    breakpoints: {
      mobile: 0,
      tablet: 768,
      desktop: 1024,
    },
  },
  motion: {
    durations: {
      micro: 120,
      small: 200,
      medium: 280,
      large: 320,
      xlarge: 420,
    },
    spring: {
      damping: 0.8,
      stiffness: 100,
      mass: 1,
    },
    scale: {
      press: 0.98,
      hover: 1.02,
    },
  },
  layoutUtils: {
    spacing: (unit) => unit * 4,
    responsiveWidth: (percentage) => (screenWidth * percentage) / 100,
    safeAreaTop: Platform.OS === 'ios' ? 44 : 24,
    safeAreaBottom: Platform.OS === 'ios' ? 34 : 16,
  },
};

// Usage examples:
// import { spacing, radii, elevation, components, layoutUtils } from './styles/layout';
// 
// // Use spacing tokens:
// const containerStyle = {
//   padding: spacing.base,
//   marginVertical: spacing.lg,
// };
// 
// // Use elevation tokens:
// const cardStyle = {
//   ...elevation.medium,
//   borderRadius: radii.squircle,
// };
// 
// // Use component specifications:
// const buttonStyle = {
//   ...components.button.primary,
//   backgroundColor: themeColors.accentStart,
// };
// 
// // Use utility functions:
// const responsiveWidth = layoutUtils.responsiveWidth(80); // 80% of screen width

// Main layout object export is already defined above (line 216)