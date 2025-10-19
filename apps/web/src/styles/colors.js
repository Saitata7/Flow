// styles/colors.js - Based on mobile app color system
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
  },
};

// Simple gradients
export const gradients = {
  mainBackground: ['#FEDFCE', '#FFE3C3'],
  accentGradient: ['#F7BA53', '#F7A053'],
};

// Typography system based on mobile app
export const typography = {
  h1: {
    fontSize: '48px',
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  
  h2: {
    fontSize: '36px',
    lineHeight: '1.3',
    fontWeight: '700',
    letterSpacing: '-0.2px',
  },
  
  h3: {
    fontSize: '24px',
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '-0.1px',
  },
  
  h4: {
    fontSize: '20px',
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '0',
  },
  
  body: {
    fontSize: '16px',
    lineHeight: '1.6',
    fontWeight: '400',
    letterSpacing: '0',
  },
  
  sub: {
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: '400',
    letterSpacing: '0.1px',
  },
  
  caption: {
    fontSize: '12px',
    lineHeight: '1.3',
    fontWeight: '400',
    letterSpacing: '0.2px',
  },
};

// Layout system based on mobile app
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  x2l: '32px',
  x3l: '40px',
  x4l: '48px',
  x5l: '64px',
};

export const radii = {
  small: '8px',
  base: '12px',
  squircle: '18px',
  large: '28px',
  circle: '50%',
};

export const elevation = {
  low: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  medium: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  high: {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
  },
};
