export const DARK_COLORS = {
  background: '#131314',
  surface: '#131314',
  surfaceLow: '#1C1B1C',
  surfaceHigh: '#2A2A2B',
  surfaceHighest: '#353436',
  primary: '#B8C3FF',
  primaryContainer: '#2E5BFF',
  onPrimary: '#002388',
  onPrimaryContainer: '#EFEFFF',
  secondary: '#B8C3FF',
  secondaryContainer: '#33438C',
  tertiary: '#FFB59B',
  tertiaryContainer: '#C24100',
  error: '#FFB4AB',
  onSurface: '#E5E2E3',
  onSurfaceVariant: '#C4C5D9',
  outline: '#8E90A2',
  outlineVariant: '#434656',
  hyperBlue: '#2E5BFF',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassDark: 'rgba(0, 0, 0, 0.3)',
  glowBlue: 'rgba(46, 91, 255, 0.4)',
};

export const LIGHT_COLORS = {
  background: '#F4F4F8',
  surface: '#F4F4F8',
  surfaceLow: '#FFFFFF',
  surfaceHigh: '#E8E8F0',
  surfaceHighest: '#DCDCE8',
  primary: '#2E5BFF',
  primaryContainer: '#2E5BFF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#EFEFFF',
  secondary: '#2E5BFF',
  secondaryContainer: '#C8D0FF',
  tertiary: '#C24100',
  tertiaryContainer: '#FFB59B',
  error: '#BA1A1A',
  onSurface: '#1A1A2E',
  onSurfaceVariant: '#44475A',
  outline: '#767899',
  outlineVariant: '#C4C5D9',
  hyperBlue: '#2E5BFF',
  glass: 'rgba(0, 0, 0, 0.04)',
  glassDark: 'rgba(0, 0, 0, 0.08)',
  glowBlue: 'rgba(46, 91, 255, 0.2)',
};

// Default export — screens that haven't been updated to use useThemeColors()
// still get the dark palette so nothing breaks
export const COLORS = DARK_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const ROUNDNESS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONTS = {
  display: 'Manrope-Bold',
  headline: 'Manrope-SemiBold',
  title: 'Inter-SemiBold',
  body: 'Inter-Regular',
  label: 'Inter-Medium',
};
