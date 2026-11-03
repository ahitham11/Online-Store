import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  ElMessiri_400Regular,
  ElMessiri_500Medium,
  ElMessiri_600SemiBold,
  ElMessiri_700Bold,
} from '@expo-google-fonts/el-messiri';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { useFonts } from 'expo-font';

export const fontAssets = {
  Anton_400Regular,
  ElMessiri_400Regular,
  ElMessiri_500Medium,
  ElMessiri_600SemiBold,
  ElMessiri_700Bold,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
};

export type AppFontFamily =
  | 'display'
  | 'displayItalic'
  | 'displayMedium'
  | 'title'
  | 'body'
  | 'bodyMedium'
  | 'bodySemiBold'
  | 'bodyBold'
  | 'label'
  /** The VEIVETY wordmark: heavy condensed capitals, Latin in both languages. */
  | 'logo';

export const fontFamilies: Record<AppFontFamily, { ar: string; en: string }> = {
  display: { ar: 'ElMessiri_600SemiBold', en: 'CormorantGaramond_400Regular' },
  displayItalic: { ar: 'ElMessiri_600SemiBold', en: 'CormorantGaramond_400Regular_Italic' },
  displayMedium: { ar: 'ElMessiri_500Medium', en: 'CormorantGaramond_500Medium' },
  title: { ar: 'ElMessiri_600SemiBold', en: 'CormorantGaramond_500Medium' },
  body: { ar: 'IBMPlexSansArabic_400Regular', en: 'DMSans_400Regular' },
  bodyMedium: { ar: 'IBMPlexSansArabic_500Medium', en: 'DMSans_500Medium' },
  bodySemiBold: { ar: 'IBMPlexSansArabic_600SemiBold', en: 'DMSans_600SemiBold' },
  bodyBold: { ar: 'IBMPlexSansArabic_700Bold', en: 'DMSans_600SemiBold' },
  label: { ar: 'IBMPlexSansArabic_500Medium', en: 'DMSans_500Medium' },
  logo: { ar: 'Anton_400Regular', en: 'Anton_400Regular' },
};

export function useAppFonts() {
  return useFonts(fontAssets);
}
