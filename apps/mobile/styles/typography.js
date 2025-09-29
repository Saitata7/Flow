// styles/typography.js
// Tyscale typography system for Flow mobile app
// Production-grade type scale with em-based guidance
// Follows accessibility standards and responsive design principles

import { Platform } from 'react-native';

/**
 * Typography Utility Functions
 * 1em = base body size (16px) for relative scaling
 */
export const typographyUtils = {
  // Convert px to em (1em = 16px base)
  pxToEm: (px) => px / 16,
  
  // Convert em to px (for React Native which uses dp)
  emToPx: (em) => em * 16,
  
  // Calculate line height multiplier
  lineHeightMultiplier: (fontSize, lineHeight) => lineHeight / fontSize,
};

// Tyscale Type Tokens (em-based values for relative scaling)
export const typographyTokens = {
  // Hero and display text
  h1: { 
    size: 34, // 2.125em
    lineHeight: 42, // 1.235 multiplier
    weight: 700,
    letterSpacing: -0.5,
    usage: 'Hero headings, app titles'
  },
  
  // Major section headers
  h2: { 
    size: 28, // 1.75em
    lineHeight: 36, // 1.286 multiplier
    weight: 700,
    letterSpacing: -0.2,
    usage: 'Section headers, major flow titles'
  },
  
  // Subsection headers
  h3: { 
    size: 22, // 1.375em
    lineHeight: 28, // 1.273 multiplier
    weight: 600,
    letterSpacing: -0.1,
    usage: 'Card titles, subsection headers'
  },
  
  // Small headers and labels
  h4: { 
    size: 18, // 1.125em
    lineHeight: 24, // 1.333 multiplier
    weight: 600,
    letterSpacing: 0,
    usage: 'Small headers, important labels'
  },
  
  // Body text (base size)
  body: { 
    size: 16, // 1em (base)
    lineHeight: 22, // 1.375 multiplier
    weight: 400,
    letterSpacing: 0,
    usage: 'Primary body text, descriptions'
  },
  
  // Secondary text
  sub: { 
    size: 14, // 0.875em
    lineHeight: 20, // 1.429 multiplier
    weight: 400,
    letterSpacing: 0.1,
    usage: 'Secondary info, timestamps'
  },
  
  // Small text and captions
  caption: { 
    size: 12, // 0.75em
    lineHeight: 16, // 1.333 multiplier
    weight: 400,
    letterSpacing: 0.2,
    usage: 'Captions, hints, metadata'
  },
};

// Font family definitions
export const fontFamilies = {
  regular: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'Roboto-Regular',
  medium: Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'Roboto-Medium',
  semibold: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'Roboto-Medium',
  bold: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'Roboto-Bold',
};

// Pre-composed typography styles
export const typography = {
  // Hero and display styles
  h1: {
    fontSize: typographyTokens.h1.size,
    lineHeight: typographyTokens.h1.lineHeight,
    fontWeight: typographyTokens.h1.weight.toString(),
    letterSpacing: typographyTokens.h1.letterSpacing,
    fontFamily: fontFamilies.bold,
  },
  
  h2: {
    fontSize: typographyTokens.h2.size,
    lineHeight: typographyTokens.h2.lineHeight,
    fontWeight: typographyTokens.h2.weight.toString(),
    letterSpacing: typographyTokens.h2.letterSpacing,
    fontFamily: fontFamilies.bold,
  },
  
  h3: {
    fontSize: typographyTokens.h3.size,
    lineHeight: typographyTokens.h3.lineHeight,
    fontWeight: typographyTokens.h3.weight.toString(),
    letterSpacing: typographyTokens.h3.letterSpacing,
    fontFamily: fontFamilies.semibold,
  },
  
  h4: {
    fontSize: typographyTokens.h4.size,
    lineHeight: typographyTokens.h4.lineHeight,
    fontWeight: typographyTokens.h4.weight.toString(),
    letterSpacing: typographyTokens.h4.letterSpacing,
    fontFamily: fontFamilies.semibold,
  },
  
  // Body text styles
  body: {
    fontSize: typographyTokens.body.size,
    lineHeight: typographyTokens.body.lineHeight,
    fontWeight: typographyTokens.body.weight.toString(),
    letterSpacing: typographyTokens.body.letterSpacing,
    fontFamily: fontFamilies.regular,
  },
  
  sub: {
    fontSize: typographyTokens.sub.size,
    lineHeight: typographyTokens.sub.lineHeight,
    fontWeight: typographyTokens.sub.weight.toString(),
    letterSpacing: typographyTokens.sub.letterSpacing,
    fontFamily: fontFamilies.regular,
  },
  
  caption: {
    fontSize: typographyTokens.caption.size,
    lineHeight: typographyTokens.caption.lineHeight,
    fontWeight: typographyTokens.caption.weight.toString(),
    letterSpacing: typographyTokens.caption.letterSpacing,
    fontFamily: fontFamilies.regular,
  },
  
  // Component-specific styles
  button: {
    fontSize: typographyTokens.body.size, // 16px
    lineHeight: typographyTokens.body.lineHeight,
    fontWeight: typographyTokens.h4.weight.toString(), // 600 for emphasis
    letterSpacing: 0,
    fontFamily: fontFamilies.semibold,
  },
  
  input: {
    fontSize: typographyTokens.body.size, // 16px
    lineHeight: typographyTokens.body.lineHeight,
    fontWeight: typographyTokens.body.weight.toString(),
    letterSpacing: 0,
    fontFamily: fontFamilies.regular,
  },
  
  label: {
    fontSize: typographyTokens.sub.size, // 14px
    lineHeight: typographyTokens.sub.lineHeight,
    fontWeight: typographyTokens.h4.weight.toString(), // 600 for emphasis
    letterSpacing: 0.1,
    fontFamily: fontFamilies.semibold,
  },
  
  // Legacy compatibility (deprecated - use tokens above)
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    fontFamily: fontFamilies.bold,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    fontFamily: fontFamilies.bold,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    fontFamily: fontFamilies.bold,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
    fontFamily: fontFamilies.semibold,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    fontFamily: fontFamilies.semibold,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: fontFamilies.regular,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: fontFamilies.regular,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: fontFamilies.regular,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: fontFamilies.regular,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
    fontFamily: fontFamilies.regular,
  },
  
  // Legacy sizes object for compatibility
  sizes: {
    largeTitle: 34,
    title1: 28,
    title2: 22,
    title3: 20,
    headline: 17,
    callout: 16,
    body: 16,
    subhead: 15,
    footnote: 13,
    caption: 12,
    caption1: 12,
    caption2: 11,
    tiny: 10,
    lg: 18,
    md: 16,
    sm: 14,
  },
  
  // Legacy weights object for compatibility
  weights: {
    thin: '100',
    ultralight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },
  
  // Legacy styles object for compatibility
  styles: {
    largeTitle: {
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 41,
      fontFamily: fontFamilies.bold,
    },
    title1: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
      fontFamily: fontFamilies.bold,
    },
    title2: {
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 28,
      fontFamily: fontFamilies.bold,
    },
    title3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 25,
      fontFamily: fontFamilies.semibold,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      fontFamily: fontFamilies.semibold,
    },
    callout: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 21,
      fontFamily: fontFamilies.regular,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 21,
      fontFamily: fontFamilies.regular,
    },
    subhead: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 20,
      fontFamily: fontFamilies.regular,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      fontFamily: fontFamilies.regular,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      fontFamily: fontFamilies.regular,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      fontFamily: fontFamilies.regular,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 13,
      fontFamily: fontFamilies.regular,
    },
  },
  
  // Font families for direct access
  fontFamilies: {
    regular: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'Roboto-Regular',
    medium: Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'Roboto-Medium',
    semibold: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'Roboto-Medium',
    bold: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'Roboto-Bold',
  },
};

// Usage examples:
// import { typography, typographyTokens, typographyUtils } from './styles/typography';
// 
// // Use pre-composed styles:
// const titleStyle = typography.h1;
// 
// // Use tokens for custom composition:
// const customStyle = {
//   fontSize: typographyTokens.h2.size,
//   fontWeight: typographyTokens.h2.weight.toString(),
//   color: themeColors.textPrimary,
// };
// 
// // Use utilities for responsive scaling:
// const responsiveSize = typographyUtils.emToPx(1.5); // 24px
// const emValue = typographyUtils.pxToEm(20); // 1.25em