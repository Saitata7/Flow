// styles/colors.js
// Comprehensive color palette for Flow Tracker app
// Supports light/dark modes with iOS-inspired semantics
// Extended for flow-specific elements like streaks, progress, and categories

export const colors = {
    light: {
      // iOS System Colors
      primaryOrange: '#FF9500', // Main accent for buttons, highlights
      primaryOrangeVariants: {
        dark: '#FF8C00', // Pressed/hover state
        light: '#FFB84D', // Disabled or secondary
        vibrant: '#FF7A00', // Intense highlights
      },
      successGreen: '#34C759', // Completed flows, checkmarks
      background: '#FFF0E6', // Warm peachy-pink main background
      cardBackground: '#FFFFFF', // Flow cards, modals
      iOSBlue: '#007AFF', // Links, secondary actions
  
      // Text Colors
      primaryText: '#1D1D1F', // Main flow titles, body text
      secondaryText: '#86868B', // Subtitles, dates
      tertiaryText: '#C7C7CC', // Hints, metadata
      placeholderText: '#AEAEB2', // Input placeholders
  
      // Semantic Colors
      error: '#FF3B30', // Missed flows, alerts
      warning: '#FF9500', // Streak warnings, partial progress
      info: '#007AFF', // Tips, info modals
      success: '#34C759', // Completions, achievements
  
      // Streak Counter Colors
      streakGradient: ['#FF9500', '#FF3B30'], // Orange to red for streak flames/progress
      badgeBackground: '#FFCC00', // Streak badges, achievements
  
      // Flow Tracker Specific
      flowCompleted: '#34C759', // Green fill for done days
      flowMissed: '#FF3B30', // Red for missed
      flowInProgress: '#FF9500', // Orange for ongoing
      progressFill: '#FF9500', // Progress bars/rings
      progressBackground: '#E5E5EA', // Unfilled progress
      streakText: '#FFFFFF', // Text on streak badges
      categoryPastels: {
        productivity: '#CADBFC', // Soft blue
        wellness: '#FEECF5', // Light pink
        fitness: '#F9EAFE', // Pastel purple
        learning: '#EBBCFC', // Pastel magenta
        custom: '#FF0061', // Vibrant accent pink
      },
      calendarDayNeutral: '#E5E5EA', // Empty calendar days
      calendarDayHighlight: '#FFB84D', // Current day border
    },
    dark: {
      // Adapted from iOS dark mode cheat sheet (e.g., lighter accents for visibility)
      primaryOrange: '#FF9F0A', // Brighter orange for dark
      primaryOrangeVariants: {
        dark: '#FF9500',
        light: '#FFC53A',
        vibrant: '#FF9F0A',
      },
      successGreen: '#32D74B', // Brighter green
      background: '#1C1C1E', // Dark neutral background
      cardBackground: '#2C2C2E', // Elevated cards
      iOSBlue: '#0A84FF', // Brighter blue
  
      // Text Colors (inverted for dark)
      primaryText: '#FFFFFF',
      secondaryText: '#EBEBF599', // Semi-transparent white
      tertiaryText: '#EBEBF560',
      placeholderText: '#EBEBF530',
  
      // Semantic Colors (brighter in dark)
      error: '#FF453A',
      warning: '#FF9F0A',
      info: '#0A84FF',
      success: '#32D74B',
  
      // Streak Counter Colors
      streakGradient: ['#FF9F0A', '#FF453A'], // Adjusted for dark
      badgeBackground: '#FFD60A', // Brighter gold
  
      // Flow Tracker Specific
      flowCompleted: '#32D74B',
      flowMissed: '#FF453A',
      flowInProgress: '#FF9F0A',
      progressFill: '#FF9F0A',
      progressBackground: '#3A3A3C',
      streakText: '#000000', // Dark text on light badges
      categoryPastels: {
        productivity: '#3A4B6C', // Darkened blue
        wellness: '#6E5C65', // Darkened pink
        fitness: '#695C6E', // Darkened purple
        learning: '#5B4B6C', // Darkened magenta
        custom: '#FF0061', // Keep vibrant
      },
      calendarDayNeutral: '#3A3A3C',
      calendarDayHighlight: '#FFC53A',
    },
  };
  
  // Usage example in components:
  // import { colors } from './styles/colors';
  // import { useColorScheme } from 'react-native';
  // const scheme = useColorScheme();
  // const themeColors = colors[scheme || 'light'];