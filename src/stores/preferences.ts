import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/storage';
import type { ThemePreference } from '@/theme/tokens';

export type AppLanguage = 'ar' | 'en';

type PreferencesState = {
  language: AppLanguage;
  theme: ThemePreference;
  hasSeenOpening: boolean;
  reduceMotionOverride: boolean | null;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: ThemePreference) => void;
  markOpeningSeen: () => void;
  setReduceMotionOverride: (value: boolean | null) => void;
  resetPreferences: () => void;
};

const initialState = {
  language: 'ar' as AppLanguage,
  theme: 'system' as ThemePreference,
  hasSeenOpening: false,
  reduceMotionOverride: null as boolean | null,
};

const storage = createJSONStorage(() => mmkvStorage as StateStorage);

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...initialState,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      markOpeningSeen: () => set({ hasSeenOpening: true }),
      setReduceMotionOverride: (reduceMotionOverride) => set({ reduceMotionOverride }),
      resetPreferences: () => set(initialState),
    }),
    {
      name: 'velvety.preferences.v1',
      storage,
      version: 1,
      partialize: ({ language, theme, hasSeenOpening, reduceMotionOverride }) => ({
        language,
        theme,
        hasSeenOpening,
        reduceMotionOverride,
      }),
      migrate: (persisted) => persisted as PreferencesState,
    },
  ),
);
