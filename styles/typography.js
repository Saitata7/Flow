// styles/typography.js
// Robust typography system for Flow Tracker app
// iOS-inspired (SF Pro) with Android fallback (Roboto)
// Sizes and weights optimized for mobile: larger for headers, compact for captions
// Line heights calculated for ~1.3 multiplier, ensuring breathing room in lists/notes
// Usage: Compose styles like { ...typography.styles.title1, color: theme.colors.primaryText }

import { Platform } from 'react-native';

export const typography = {
  fonts: {
    family: {
      regular: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'Roboto-Regular',
      bold: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'Roboto-Bold',
      medium: Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'Roboto-Medium',
      light: Platform.OS === 'ios' ? 'SFProDisplay-Light' : 'Roboto-Light',
      // Note: Ensure SF Pro is bundled or use system font ('System') for iOS
    },
  },
  sizes: {
    largeTitle: 34, // App headers like "My Flows"
    title1: 28, // Section headers like "Today's Progress"
    title2: 22, // Flow names like "Morning Run"
    title3: 20, // Card titles, sub-sections
    headline: 17, // Important labels, buttons
    body: 17, // Regular text, descriptions
    callout: 16, // Secondary info, notes
    subhead: 15, // Timestamps like "12:00 AM"
    footnote: 13, // Small labels, metadata
    caption1: 12, // Very small text, hints
    caption2: 11, // Tiny text, e.g., version numbers
  },
  weights: {
    ultraLight: '100',
    thin: '200',
    light: '300',
    regular: '400', // Default for body
    medium: '500', // Labels, buttons
    semibold: '600', // Emphasis in text
    bold: '700', // Headers, streak counts
    heavy: '800',
    black: '900', // Rare, for ultra-bold accents
  },
  lineHeights: {
    largeTitle: 41, // 34 * 1.2
    title1: 34, // 28 * 1.21
    title2: 28, // 22 * 1.27
    title3: 25, // 20 * 1.25
    headline: 22, // 17 * 1.29
    body: 22, // 17 * 1.29
    callout: 21, // 16 * 1.31
    subhead: 20, // 15 * 1.33
    footnote: 18, // 13 * 1.38
    caption1: 16, // 12 * 1.33
    caption2: 14, // 11 * 1.27
  },
  letterSpacing: {
    largeTitle: -0.5, // Negative for large text (tighter)
    title: -0.2,
    body: 0,
    small: 0.2, // Positive for captions (tracked out)
    trackedCaps: 0.5, // For uppercase labels
  },

  // Pre-composed Styles for Flow Tracker Components
  styles: {
    flowTitle: {
      fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'Roboto-Bold',
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    streakCount: {
      fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'Roboto-Bold',
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    progressLabel: {
      fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'Roboto-Medium',
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0,
    },
    noteText: {
      fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'Roboto-Regular',
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400',
      letterSpacing: 0,
    },
    timestamp: {
      fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Light' : 'Roboto-Light',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
  },
};

// Pro Tip: For dynamic scaling, integrate with react-native-responsive-fontsize