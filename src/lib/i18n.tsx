import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';

import { ar, en, type TranslationKey } from '@/lib/dictionary';
import { usePreferencesStore, type AppLanguage } from '@/stores/preferences';

type Vars = Record<string, string | number>;

type I18nContextValue = {
  language: AppLanguage;
  isRTL: boolean;
  t: (key: TranslationKey, vars?: Vars) => string;
  setLanguage: (language: AppLanguage) => void;
  localized: (arValue: string | null | undefined, enValue: string | null | undefined) => string;
  formatNumber: (value: number, opts?: Intl.NumberFormatOptions) => string;
  formatEgp: (value: number, opts?: { decimals?: boolean }) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = usePreferencesStore((state) => state.language);
  const setLanguageInStore = usePreferencesStore((state) => state.setLanguage);
  const isRTL = language === 'ar';

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      const dictionary = language === 'ar' ? ar : en;
      return interpolate(dictionary[key] ?? key, vars);
    },
    [language],
  );

  const localized = useCallback(
    (arValue: string | null | undefined, enValue: string | null | undefined) => {
      const primary = language === 'ar' ? arValue : enValue;
      const fallback = language === 'ar' ? enValue : arValue;
      return (primary ?? fallback ?? '').trim();
    },
    [language],
  );

  const formatNumber = useCallback(
    (value: number, opts?: Intl.NumberFormatOptions) => {
      try {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
          numberingSystem: 'latn',
          maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
          ...opts,
        }).format(value);
      } catch {
        return String(value);
      }
    },
    [language],
  );

  const formatEgp = useCallback(
    (value: number, opts?: { decimals?: boolean }) => {
      const formatted = formatNumber(value, {
        maximumFractionDigits: opts?.decimals ? 2 : 0,
        minimumFractionDigits: 0,
      });
      return `${formatted} ${language === 'ar' ? 'ج.م' : 'EGP'}`;
    },
    [formatNumber, language],
  );

  const setLanguage = useCallback(
    (next: AppLanguage) => {
      setLanguageInStore(next);
    },
    [setLanguageInStore],
  );

  useEffect(() => {
    // The app uses an explicit direction wrapper instead of forceRTL so the
    // language can change without a native reload. Keep native RTL enabled for
    // system components such as the keyboard and text selection.
    I18nManager.allowRTL(true);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    }
  }, [language, isRTL]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      isRTL,
      t,
      setLanguage,
      localized,
      formatNumber,
      formatEgp,
    }),
    [formatEgp, formatNumber, isRTL, language, localized, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}

export type { TranslationKey };
