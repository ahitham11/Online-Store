/**
 * VEIVETY design tokens: warm ink, lip-gloss rose, nude lines, warm white.
 *
 * The palette is provisional until the final identity lands in
 * catalog/catalog.json and assets/brand/. Every value is intentionally kept
 * here so the brand swap is a one-file change.
 */

export const palette = {
  aubergine: '#1C1517',
  aubergineDeep: '#0E0A0B',
  aubergineSoft: '#2A1F22',
  rose: '#B23A52',
  roseDeep: '#8E2639',
  roseLight: '#E07A8F',
  blush: '#F6DADF',
  pearl: '#FFFBFA',
  pearlDeep: '#F6EEEC',
  champagne: '#C99A86',
  champagneLight: '#EBD3C8',
  ink: '#161113',
  plumMuted: '#6B5A5E',
  plumSoft: '#8E7B80',
  white: '#FFFFFF',
  success: '#2F6B4F',
  danger: '#9A2F3F',
  warning: '#8A5A1F',
} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

export type ThemeColors = {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryBright: string;
  onPrimary: string;
  accent: string;
  accentText: string;
  border: string;
  goldLine: string;
  glass: string;
  glassStrong: string;
  overlay: string;
  skeleton: string;
  shadow: string;
  danger: string;
  success: string;
  warning: string;
  veil: string;
  plinthTop: string;
  plinthEdge: string;
  onVeil: string;
  onVeilMuted: string;
  /** Home hero ("stage"): follows the theme. stageScrim/stageHeader are 'r,g,b'. */
  stageDeep: string;
  stageMid: string;
  stageText: string;
  stageTextMuted: string;
  stageScrim: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  input: string;
};

export const lightColors: ThemeColors = {
  bg: palette.pearl,
  bgAlt: palette.pearlDeep,
  surface: '#FFFFFF',
  surfaceRaised: palette.white,
  text: palette.ink,
  textSecondary: palette.plumMuted,
  textTertiary: palette.plumSoft,
  primary: palette.roseDeep,
  primaryBright: palette.rose,
  onPrimary: palette.pearl,
  accent: palette.champagne,
  accentText: '#8A5546',
  border: 'rgba(28, 21, 23, 0.10)',
  goldLine: 'rgba(201, 154, 134, 0.46)',
  glass: 'rgba(255, 251, 250, 0.74)',
  glassStrong: 'rgba(255, 251, 250, 0.92)',
  overlay: 'rgba(14, 10, 11, 0.48)',
  skeleton: 'rgba(28, 21, 23, 0.065)',
  shadow: palette.aubergine,
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
  veil: palette.aubergineDeep,
  plinthTop: '#FFFDFC',
  plinthEdge: '#DCC6BF',
  onVeil: palette.pearl,
  onVeilMuted: 'rgba(255, 251, 250, 0.72)',
  stageDeep: '#F7ECEA',
  stageMid: '#F1D5D8',
  stageText: palette.ink,
  stageTextMuted: 'rgba(22, 17, 19, 0.68)',
  stageScrim: '255,251,250',
  tabBar: 'rgba(255, 255, 255, 0.86)',
  tabBarActive: palette.roseDeep,
  tabBarInactive: '#8E7B80',
  input: 'rgba(255, 255, 255, 0.9)',
};

export const darkColors: ThemeColors = {
  bg: '#0F0B0C',
  bgAlt: '#171113',
  surface: '#1F1719',
  surfaceRaised: '#281E21',
  text: palette.pearl,
  textSecondary: '#CFC0C2',
  textTertiary: '#A6979A',
  primary: palette.roseLight,
  primaryBright: '#EC97A8',
  onPrimary: palette.aubergine,
  accent: '#D9A99A',
  accentText: '#EBC6BA',
  border: 'rgba(255, 251, 250, 0.10)',
  goldLine: 'rgba(217, 169, 154, 0.38)',
  glass: 'rgba(31, 23, 25, 0.72)',
  glassStrong: 'rgba(31, 23, 25, 0.92)',
  overlay: 'rgba(6, 4, 5, 0.66)',
  skeleton: 'rgba(255, 251, 250, 0.07)',
  shadow: '#000000',
  danger: '#E8A0AA',
  success: '#8FC9A8',
  warning: '#E0B77F',
  veil: palette.aubergineDeep,
  plinthTop: '#F8EFED',
  plinthEdge: '#8C746C',
  onVeil: palette.pearl,
  onVeilMuted: 'rgba(255, 251, 250, 0.72)',
  stageDeep: palette.aubergineDeep,
  stageMid: palette.aubergineSoft,
  stageText: palette.pearl,
  stageTextMuted: 'rgba(255, 251, 250, 0.72)',
  stageScrim: '14,10,11',
  tabBar: 'rgba(24, 18, 20, 0.88)',
  tabBarActive: '#F4C3CD',
  tabBarInactive: '#A6979A',
  input: 'rgba(31, 23, 25, 0.9)',
};

export const themes: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
  '5xl': 72,
  '6xl': 96,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  '2xl': 36,
  '3xl': 48,
  pill: 999,
} as const;

export const hairline = 1;

export const typeScale = {
  display: { fontSize: 46, lineHeight: 54, letterSpacing: -0.4 },
  displaySmall: { fontSize: 36, lineHeight: 44, letterSpacing: -0.2 },
  title: { fontSize: 28, lineHeight: 36, letterSpacing: -0.1 },
  titleSmall: { fontSize: 22, lineHeight: 30, letterSpacing: 0 },
  subtitle: { fontSize: 18, lineHeight: 27, letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 25, letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 21, letterSpacing: 0 },
  caption: { fontSize: 11, lineHeight: 17, letterSpacing: 0.2 },
  label: { fontSize: 10, lineHeight: 16, letterSpacing: 1.8 },
  button: { fontSize: 14, lineHeight: 20, letterSpacing: 0.6 },
  price: { fontSize: 18, lineHeight: 24, letterSpacing: 0.2 },
} as const;

export const motion = {
  instant: 90,
  fast: 180,
  base: 300,
  slow: 520,
  veil: 1500,
  hero: 1800,
  easing: [0.22, 1, 0.36, 1] as const,
  easingSoft: [0.33, 1, 0.68, 1] as const,
  spring: { damping: 20, stiffness: 180, mass: 0.9 },
  springSoft: { damping: 24, stiffness: 120, mass: 1 },
} as const;

export const layout = {
  maxContentWidth: 560,
  headerHeight: 64,
  headerHeightCompact: 48,
  tabBarHeight: 68,
  tabBarBottomGap: 10,
  drawerMaxWidth: 380,
} as const;

export const zIndex = {
  base: 0,
  header: 20,
  tabBar: 30,
  drawer: 60,
  veil: 100,
} as const;

export const shadows = {
  soft: {
    shadowColor: palette.aubergine,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  lifted: {
    shadowColor: palette.aubergine,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
    elevation: 8,
  },
  floating: {
    shadowColor: palette.aubergine,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 44,
    elevation: 14,
  },
} as const;
