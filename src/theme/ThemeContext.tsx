import React, {createContext, useContext, useState, ReactNode} from 'react';
import {MD3DarkTheme, Provider as PaperProvider} from 'react-native-paper';
import {COLORS} from './tokens';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.onPrimary,
    primaryContainer: COLORS.primaryContainer,
    onPrimaryContainer: COLORS.onPrimaryContainer,
    secondary: COLORS.secondary,
    onSecondary: COLORS.onPrimary,
    secondaryContainer: COLORS.secondaryContainer,
    onSecondaryContainer: COLORS.onPrimaryContainer,
    tertiary: COLORS.tertiary,
    onTertiary: COLORS.onPrimary,
    tertiaryContainer: COLORS.tertiaryContainer,
    onTertiaryContainer: COLORS.onPrimaryContainer,
    error: COLORS.error,
    onError: COLORS.onPrimary,
    errorContainer: COLORS.tertiaryContainer,
    onErrorContainer: COLORS.onPrimaryContainer,
    background: COLORS.background,
    onBackground: COLORS.onSurface,
    surface: COLORS.surface,
    onSurface: COLORS.onSurface,
    surfaceVariant: COLORS.surfaceVariant,
    onSurfaceVariant: COLORS.onSurfaceVariant,
    outline: COLORS.outline,
    outlineVariant: COLORS.outlineVariant,
    inverseSurface: COLORS.onSurface,
    inverseOnSurface: COLORS.background,
    inversePrimary: COLORS.onPrimaryContainer,
    shadow: '#000000',
    scrim: '#000000',
  },
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{isDark, toggleTheme}}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

export const currentTheme = theme;
