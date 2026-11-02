import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { usePreferencesStore } from '@/stores/preferences';
import {
  darkColors,
  lightColors,
  themes,
  type ThemeColors,
  type ThemeMode,
  type ThemePreference,
} from '@/theme/tokens';

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  preference: ThemePreference;
  isDark: boolean;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const preference = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);

  const mode: ThemeMode =
    preference === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : preference;
  const colors = themes[mode] ?? lightColors;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {
      // Not fatal on platforms that do not support this call.
    });
  }, [colors.bg]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      mode,
      preference,
      isDark: mode === 'dark',
      setTheme,
    }),
    [colors, mode, preference, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside AppThemeProvider');
  return context;
}

export { darkColors, lightColors };
