// styles/colors.js
// Simplified colors system to fix undefined error

// Simple colors object with no dependencies
export const colors = {
  light: {
    // Main gradients
    bgStart: '#FEDFCE',
    bgEnd: '#FFE3C3',
    
    // Accent colors
    accentStart: '#F7BA53',
    accentEnd: '#F7A053',
    
    // Text colors
    textPrimary: '#3E3E3E',
    textSecondary: '#585858',
    
    // Semantic colors
    success: '#4DB34D',
    danger: '#FF6961',
    warning: '#F2A005',
    
    // Background and surface colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    border: '#E0E0E0',
    
    // Status colors
    completed: '#4DB34D',
    missed: '#FF6961',
    pending: '#FFFFFF',
    noTask: 'transparent',
    
    // Legacy compatibility
    primaryOrange: '#F7BA53',
    successGreen: '#4DB34D',
    cardBackground: '#FFFFFF',
    primaryText: '#3E3E3E',
    secondaryText: '#585858',
    error: '#FF6961',
  },
  
  dark: {
    // Main gradients
    bgStart: '#2D1B0E',
    bgEnd: '#3D2412',
    
    // Accent colors
    accentStart: '#F7BA53',
    accentEnd: '#F7A053',
    
    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    
    // Semantic colors
    success: '#5DC35D',
    danger: '#FF7A7A',
    warning: '#F2B005',
    
    // Background and surface colors
    background: '#1C1C1E',
    surface: '#2C2C2E',
    border: '#3A3A3C',
    
    // Status colors
    completed: '#5DC35D',
    missed: '#FF7A7A',
    pending: '#FFFFFF',
    noTask: 'transparent',
    
    // Legacy compatibility
    primaryOrange: '#F7BA53',
    successGreen: '#5DC35D',
    cardBackground: '#2C2C2E',
    primaryText: '#FFFFFF',
    secondaryText: 'rgba(255, 255, 255, 0.7)',
    error: '#FF7A7A',
  },
};

// HSL utility functions (separate from colors object)
export const hslUtils = {
  hsl: (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`,
  tint: (h, s, l, amount = 10) => `hsl(${h}, ${s}%, ${Math.min(100, l + amount)}%)`,
  shade: (h, s, l, amount = 10) => `hsl(${h}, ${s}%, ${Math.max(0, l - amount)}%)`,
  mute: (h, s, l, sAmount = 20, lAmount = 8) => `hsl(${h}, ${Math.max(0, s - sAmount)}%, ${Math.min(100, l + lAmount)}%)`,
};

// Simple gradients
export const gradients = {
  mainBackground: ['#FEDFCE', '#FFE3C3'],
  accentGradient: ['#F7BA53', '#F7A053'],
};