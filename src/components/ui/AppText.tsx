import { useMemo } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamilies, type AppFontFamily } from '@/lib/fonts';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { typeScale } from '@/theme/tokens';

export type TextVariant =
  | 'display'
  | 'displaySmall'
  | 'title'
  | 'titleSmall'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button'
  | 'price';

export type TextTone =
  | 'text'
  | 'secondary'
  | 'tertiary'
  | 'primary'
  | 'accent'
  | 'onVeil'
  | 'onVeilMuted'
  | 'stage'
  | 'stageMuted'
  | 'inverse'
  | 'danger'
  | 'success'
  | 'warning';

type Props = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'start' | 'center' | 'end';
  font?: AppFontFamily;
  uppercase?: boolean;
  maxScale?: number;
  italic?: boolean;
};

const familyByVariant: Record<TextVariant, AppFontFamily> = {
  display: 'display',
  displaySmall: 'display',
  title: 'title',
  titleSmall: 'title',
  subtitle: 'bodyMedium',
  body: 'body',
  bodySmall: 'body',
  caption: 'body',
  label: 'label',
  button: 'bodySemiBold',
  price: 'bodySemiBold',
};

export function AppText({
  variant = 'body',
  tone = 'text',
  align = 'start',
  font,
  uppercase = false,
  maxScale,
  italic = false,
  style,
  children,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const { isRTL, language } = useI18n();

  const resolvedColor = useMemo(() => {
    const map: Record<TextTone, string> = {
      text: colors.text,
      secondary: colors.textSecondary,
      tertiary: colors.textTertiary,
      primary: colors.primary,
      accent: colors.accentText,
      onVeil: colors.onVeil,
      onVeilMuted: colors.onVeilMuted,
      stage: colors.stageText,
      stageMuted: colors.stageTextMuted,
      inverse: colors.onPrimary,
      danger: colors.danger,
      success: colors.success,
      warning: colors.warning,
    };
    return map[tone];
  }, [colors, tone]);

  const familyKey = font ?? (italic ? 'displayItalic' : familyByVariant[variant]);
  const scale = typeScale[variant === 'displaySmall' ? 'displaySmall' : variant];
  const isArabic = language === 'ar';

  const textStyle: TextStyle = {
    fontFamily: fontFamilies[familyKey][isArabic ? 'ar' : 'en'],
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    letterSpacing: variant === 'label' && isArabic ? 0 : scale.letterSpacing,
    color: resolvedColor,
    textAlign: align === 'center' ? 'center' : align === 'end' ? (isRTL ? 'left' : 'right') : isRTL ? 'right' : 'left',
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textTransform: uppercase ? 'uppercase' : 'none',
  };

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={maxScale}
      suppressHighlighting
      style={[styles.base, textStyle, style]}
      {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    padding: 0,
    margin: 0,
  },
});
