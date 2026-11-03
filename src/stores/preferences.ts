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
  // White (light) is the store's main look; dark stays available in Account.
  theme: 'light' as ThemePreference,
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
      version: 3,
      partialize: ({ language, theme, hasSeenOpening, reduceMotionOverride, market }) => ({
        market,
        language,
        theme,
        hasSeenOpening,
        reduceMotionOverride,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PreferencesState>;
        // v3: light became the default; move shoppers still on "follow the phone" to light.
        const theme = version < 3 && (state.theme === undefined || state.theme === 'system') ? 'light' : state.theme;
        return { ...initialState, ...state, theme, market: state.market ?? deviceMarket() } as PreferencesState;
      },
    },
  ),
);
