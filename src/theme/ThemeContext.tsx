import React, {createContext, useContext, useState, ReactNode} from 'react';
import {MD3DarkTheme, MD3LightTheme, Provider as PaperProvider} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {DARK_COLORS, LIGHT_COLORS} from './tokens';

const buildTheme = (isDark: boolean) => {
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: C.primary,
      onPrimary: C.onPrimary,
      primaryContainer: C.primaryContainer,
      onPrimaryContainer: C.onPrimaryContainer,
      secondary: C.secondary,
      onSecondary: C.onPrimary,
      secondaryContainer: C.secondaryContainer,
      onSecondaryContainer: C.onPrimaryContainer,
      tertiary: C.tertiary,
      onTertiary: C.onPrimary,
      tertiaryContainer: C.tertiaryContainer,
      onTertiaryContainer: C.onPrimaryContainer,
      error: C.error,
      onError: C.onPrimary,
      errorContainer: C.tertiaryContainer,
      onErrorContainer: C.onPrimaryContainer,
      background: C.background,
      onBackground: C.onSurface,
      surface: C.surface,
      onSurface: C.onSurface,
      surfaceVariant: C.surfaceHighest,
      onSurfaceVariant: C.onSurfaceVariant,
      outline: C.outline,
      outlineVariant: C.outlineVariant,
      inverseSurface: C.onSurface,
      inverseOnSurface: C.background,
      inversePrimary: C.onPrimaryContainer,
      shadow: '#000000',
      scrim: '#000000',
    },
  };
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof DARK_COLORS;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark(prev => !prev);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const theme = buildTheme(isDark);

  return (
    <ThemeContext.Provider value={{isDark, toggleTheme, colors}}>
      <PaperProvider
        theme={theme}
        settings={{
          icon: props => <MaterialCommunityIcons {...props} />,
        }}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
};

// Convenience hook — returns the active color palette
export const useThemeColors = () => useAppTheme().colors;
