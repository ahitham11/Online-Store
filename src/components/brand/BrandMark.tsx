import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { brand } from '@/data/brand';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { palette } from '@/theme/tokens';

type Tone = 'dark' | 'light' | 'gold';

type BrandMarkProps = {
  variant?: 'lockup' | 'wordmark' | 'monogram';
  tone?: Tone;
  size?: number;
  showHandle?: boolean;
  align?: 'start' | 'center' | 'end';
};

export function BrandMark({
  variant = 'lockup',
  tone = 'dark',
  size = 1,
  showHandle = false,
  align = 'center',
}: BrandMarkProps) {
  const { language, isRTL } = useI18n();
  const { colors } = useTheme();
  const color = tone === 'gold' ? colors.accent : tone === 'light' ? colors.onVeil : colors.text;
  const muted = tone === 'gold' ? colors.accent : tone === 'light' ? colors.onVeilMuted : colors.textSecondary;
  const alignItems = align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'flex-start';

  if (brand.logoSource) {
    return (
      <Image
        source={brand.logoSource}
        style={{ width: 160 * size, height: 48 * size }}
        contentFit="contain"
        accessibilityLabel={language === 'ar' ? brand.nameAr : brand.nameEn}
      />
    );
  }

  if (variant === 'monogram') {
    return <Monogram size={44 * size} color={color} gold={colors.accent} />;
  }

  const isArabic = language === 'ar';
  // The logo is Latin on every package, so it stays Latin in Arabic too.
  const wordmark = brand.nameEn.toUpperCase();
  const eyebrow = 'BEAUTY WITH';

  return (
    <View style={[styles.wrap, { alignItems }]}>
      {variant === 'lockup' ? (
        <View style={styles.eyebrowRow}>
          <View style={[styles.eyebrowLine, { backgroundColor: colors.goldLine }]} />
          <AppText
            variant="label"
            tone={tone === 'gold' ? 'accent' : tone === 'light' ? 'onVeilMuted' : 'secondary'}
            style={[styles.eyebrow, { fontSize: 8 * size, letterSpacing: 2.2, fontFamily: 'DMSans_600SemiBold' }]}
            maxScale={1.2}>
            {eyebrow}
          </AppText>
          <View style={[styles.eyebrowLine, { backgroundColor: colors.goldLine }]} />
        </View>
      ) : null}
      <AppText
        style={[
          styles.wordmark,
          {
            color,
            fontSize: 30 * size,
            lineHeight: 36 * size,
            letterSpacing: 1.2 * size,
            writingDirection: 'ltr',
          },
        ]}
        font="logo"
        maxScale={1.25}
        accessibilityLabel={wordmark}>
        {wordmark}
      </AppText>
      {variant === 'lockup' ? (
        <View style={[styles.taglineRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.rule, { backgroundColor: colors.goldLine }]} />
          <AppText
            variant="caption"
            style={[
              styles.tagline,
              { color: muted, fontSize: 8.5 * size, letterSpacing: isArabic ? 0 : 2.4 },
            ]}
            maxScale={1.2}>
            {isArabic ? 'جمالك بلمسة مخملية' : 'BEAUTY WITH A VELVET TOUCH'}
          </AppText>
          <View style={[styles.rule, { backgroundColor: colors.goldLine }]} />
        </View>
      ) : null}
      {showHandle ? (
        <AppText
          variant="caption"
          tone={tone === 'light' ? 'onVeilMuted' : 'tertiary'}
          style={[styles.handle, { fontSize: 9 * size, letterSpacing: 1.2 }]}>
          @{brand.handle}
        </AppText>
      ) : null}
    </View>
  );
}

export function Monogram({ size = 44, color = palette.pearl, gold = palette.champagne }: { size?: number; color?: string; gold?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx="32" cy="32" r="30.2" stroke={gold} strokeWidth="0.9" fill="none" />
      <Circle cx="32" cy="32" r="27.4" stroke={gold} strokeWidth="0.45" fill="none" opacity={0.7} />
      <Path
        d="M18.8 18.5c2.8 12.2 7 21.2 11.6 27.2.8 1.1 2.4 1.1 3.2 0 4.6-6 8.8-15 11.6-27.2"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M25.4 26.4c2.2 1.5 4.2 2.2 6.6 2.2s4.4-.7 6.6-2.2"
        stroke={gold}
        strokeWidth="0.85"
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      <Circle cx="32" cy="49.3" r="1.55" fill={gold} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowLine: {
    width: 14,
    height: StyleSheet.hairlineWidth,
  },
  eyebrow: {
    textAlign: 'center',
  },
  wordmark: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  taglineRow: {
    alignItems: 'center',
    gap: 7,
    marginTop: 1,
  },
  rule: {
    width: 18,
    height: StyleSheet.hairlineWidth,
  },
  tagline: {
    textAlign: 'center',
  },
  handle: {
    marginTop: 6,
    textAlign: 'center',
  },
});
