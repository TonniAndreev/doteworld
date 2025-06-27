export const COLORS = {
  // Primary colors (Orange-Red)
  primary: '#F1662E',
  primaryLight: 'rgba(241, 102, 46, 0.1)',
  primaryMedium: 'rgba(241, 102, 46, 0.3)',
  primaryDark: '#C54A1F',
  primaryExtraLight: 'rgba(241, 102, 46, 0.05)',
  
  // Secondary colors (Turquoise)
  secondary: '#2EF2D1',
  secondaryLight: 'rgba(46, 242, 209, 0.1)',
  secondaryMedium: 'rgba(46, 242, 209, 0.3)',
  secondaryDark: '#1FC2A3',
  secondaryExtraLight: 'rgba(46, 242, 209, 0.05)',
  
  // Tertiary colors (Purple)
  tertiary: '#842EF2',
  tertiaryLight: 'rgba(132, 46, 242, 0.1)',
  tertiaryMedium: 'rgba(132, 46, 242, 0.3)',
  tertiaryDark: '#6B1FC2',
  tertiaryExtraLight: 'rgba(132, 46, 242, 0.05)',
  
  // Accent colors (Yellow)
  accent: '#F2EE2E',
  accentLight: 'rgba(242, 238, 46, 0.1)',
  accentMedium: 'rgba(242, 238, 46, 0.3)',
  accentDark: '#C2BE1F',
  accentExtraLight: 'rgba(242, 238, 46, 0.05)',
  
  // Status colors
  success: '#34C759',
  successLight: 'rgba(52, 199, 89, 0.1)',
  successMedium: 'rgba(52, 199, 89, 0.3)',
  successDark: '#28A745',
  
  warning: '#FF9500',
  warningLight: 'rgba(255, 149, 0, 0.1)',
  warningMedium: 'rgba(255, 149, 0, 0.3)',
  warningDark: '#D17D00',
  
  error: '#FF3B30',
  errorLight: 'rgba(255, 130, 123, 0.5)',
  errorMedium: 'rgba(255, 59, 48, 0.3)',
  errorDark: '#D32F2F',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  neutralLight: '#F5F5F5',
  neutralMedium: '#9E9E9E',
  neutralDark: '#424242',
  neutralExtraLight: '#FAFAFA',
  neutralExtraDark: '#212121',
  
  // Special colors
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  
  // Gradient combinations
  gradientPrimary: ['#F1662E', '#C54A1F'],
  gradientSecondary: ['#2EF2D1', '#1FC2A3'],
  gradientTertiary: ['#842EF2', '#6B1FC2'],
  gradientAccent: ['#F2EE2E', '#C2BE1F'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  largeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    lineHeight: 44,
  },
  title1: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    lineHeight: 34,
  },
  title2: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  title3: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    lineHeight: 25,
  },
  headline: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  },
  callout: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 22,
  },
  subhead: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  footnote: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  caption: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
  },
};

// Color utility functions
export const getColorWithOpacity = (color, opacity) => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Theme variants for different contexts
export const THEME_VARIANTS = {
  light: {
    background: COLORS.white,
    surface: COLORS.neutralExtraLight,
    text: COLORS.neutralDark,
    textSecondary: COLORS.neutralMedium,
    border: COLORS.neutralLight,
  },
  dark: {
    background: COLORS.neutralExtraDark,
    surface: COLORS.neutralDark,
    text: COLORS.white,
    textSecondary: COLORS.neutralMedium,
    border: COLORS.neutralDark,
  },
};