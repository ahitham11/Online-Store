import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { getLocales } from 'expo-localization';

import { marketFromRegion, type MarketCode } from '@/lib/markets';
import { mmkvStorage } from '@/lib/storage';
import type { ThemePreference } from '@/theme/tokens';

export type AppLanguage = 'ar' | 'en';

type PreferencesState = {
  language: AppLanguage;
  theme: ThemePreference;
  hasSeenOpening: boolean;
  reduceMotionOverride: boolean | null;
  market: MarketCode;
  setMarket: (market: MarketCode) => void;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: ThemePreference) => void;
  markOpeningSeen: () => void;
  setReduceMotionOverride: (value: boolean | null) => void;
  resetPreferences: () => void;
};

function deviceMarket(): MarketCode {
  try {
    return marketFromRegion(getLocales()[0]?.regionCode);
  } catch {
    return marketFromRegion(null);
  }
}

const initialState = {
  language: 'ar' as AppLanguage,
  theme: 'system' as ThemePreference,
  hasSeenOpening: false,
  reduceMotionOverride: null as boolean | null,
  market: deviceMarket(),
};

const storage = createJSONStorage(() => mmkvStorage as StateStorage);

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...initialState,
      setMarket: (market) => set({ market }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      markOpeningSeen: () => set({ hasSeenOpening: true }),
      setReduceMotionOverride: (reduceMotionOverride) => set({ reduceMotionOverride }),
      resetPreferences: () => set(initialState),
    }),
    {
      name: 'velvety.preferences.v1',
      storage,
      version: 2,
      partialize: ({ language, theme, hasSeenOpening, reduceMotionOverride, market }) => ({
        market,
        language,
        theme,
        hasSeenOpening,
        reduceMotionOverride,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<PreferencesState>;
        return { ...initialState, ...state, market: state.market ?? deviceMarket() } as PreferencesState;
      },
    },
  ),
);
