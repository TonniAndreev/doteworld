export const COLORS = {
  // Primary colors
  primary: '#8A4FFF',
  primaryLight: 'rgba(138, 79, 255, 0.1)',
  primaryDark: '#6B3ED1',
  
  // Secondary colors
  secondary: '#00D1C1',
  secondaryLight: 'rgba(0, 209, 193, 0.1)',
  secondaryDark: '#00A69A',
  
  // Accent colors
  accent: '#FF9500',
  accentLight: 'rgba(255, 149, 0, 0.1)',
  accentDark: '#D17D00',
  
  // Status colors
  success: '#34C759',
  successLight: 'rgba(52, 199, 89, 0.1)',
  warning: '#FFCC00',
  warningLight: 'rgba(255, 204, 0, 0.1)',
  error: '#FF3B30',
  errorLight: 'rgba(255, 59, 48, 0.1)',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  neutralLight: '#F5F5F5',
  neutralMedium: '#9E9E9E',
  neutralDark: '#424242',
  
  // Special colors
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

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
} as const;