import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand/BrandMark';
import { GrainOverlay } from '@/components/chrome/GrainOverlay';
import { AppText } from '@/components/ui/AppText';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon, type IconName } from '@/components/ui/Icon';
import { brand, getWhatsAppUrl } from '@/data/brand';
import { policySlugs, type PolicySlug } from '@/data/policies';
import { hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { palette, spacing } from '@/theme/tokens';

const policyLabel: Record<PolicySlug, Parameters<ReturnType<typeof useI18n>['t']>[0]> = {
  shipping: 'footer.shipping',
  returns: 'footer.returns',
  privacy: 'footer.privacy',
  terms: 'footer.terms',
};

export function Footer() {
  const { t, isRTL, language } = useI18n();
  const { colors } = useTheme();
  const whatsapp = getWhatsAppUrl();
  const year = new Date().getFullYear();

  const social: { key: string; icon: IconName; label: string; href: string | null }[] = [
    {
      key: 'instagram',
      icon: 'instagram',
      label: `@${brand.handle}`,
      href: brand.instagramUrl,
    },
    {
      key: 'whatsapp',
      icon: 'whatsapp',
      label: t('footer.contact'),
      href: whatsapp,
    },
  ];

  return (
    <View style={[styles.wrap, { borderTopColor: colors.goldLine }]}>
      <GrainOverlay opacity={0.06} />
      <View style={styles.inner}>
        <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <BrandMark variant="lockup" tone="light" size={0.82} align="start" />
          <Icon name="sparkle" size={22} color={palette.champagne} />
        </View>

        <AppText variant="displaySmall" tone="onVeil" style={styles.manifesto} maxScale={1.2}>
          {t('home.manifestoLine')}
        </AppText>

        <GoldRule width="46%" color="rgba(201, 154, 134, 0.44)" />

        <AppText variant="bodySmall" tone="onVeilMuted" style={styles.description} maxScale={1.25}>
          {t('footer.description', { handle: brand.handle })}
        </AppText>

        <View style={[styles.columns, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.column}>
            <AppText variant="label" tone="accent" style={styles.columnTitle} maxScale={1.2}>
              {t('footer.policies')}
            </AppText>
            {policySlugs.map((slug) => (
              <Pressable
                key={slug}
                accessibilityRole="link"
                onPress={() => router.push(`/policies/${slug}`)}
                hitSlop={6}
                style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}>
                <AppText variant="bodySmall" tone="onVeilMuted" maxScale={1.25}>
                  {t(policyLabel[slug])}
                </AppText>
              </Pressable>
            ))}
          </View>

          <View style={styles.column}>
            <AppText variant="label" tone="accent" style={styles.columnTitle} maxScale={1.2}>
              {t('footer.follow')}
            </AppText>
            {social.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="link"
                accessibilityState={{ disabled: !item.href }}
                disabled={!item.href}
                onPress={() => {
                  if (!item.href) return;
                  hapticTap();
                  Linking.openURL(item.href).catch(() => undefined);
                }}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.linkRow,
                  { opacity: !item.href ? 0.36 : pressed ? 0.6 : 1 },
                ]}>
                <Icon name={item.icon} size={15} color={palette.champagneLight} />
                <AppText variant="bodySmall" tone="onVeilMuted" maxScale={1.25}>
                  {item.label}
                </AppText>
              </Pressable>
            ))}
            {!whatsapp ? (
              <AppText variant="caption" tone="onVeilMuted" style={styles.unavailable} maxScale={1.2}>
                {t('drawer.whatsappUnavailable')}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={[styles.contactRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <AppText variant="caption" tone="onVeilMuted" maxScale={1.2}>
            {t('footer.madeIn')}
          </AppText>
          <View style={[styles.dot, { backgroundColor: palette.champagne }]} />
          <AppText variant="caption" tone="onVeilMuted" maxScale={1.2}>
            {language === 'ar' ? 'تُشحن داخل مصر' : 'Shipping across Egypt'}
          </AppText>
        </View>

        <GoldRule width="100%" color="rgba(201, 154, 134, 0.28)" diamond={false} />

        <AppText variant="caption" tone="onVeilMuted" align="center" style={styles.payment} maxScale={1.2}>
          {t('footer.paymentNote')}
        </AppText>

        <AppText variant="caption" tone="onVeilMuted" align="center" maxScale={1.2}>
          {t('footer.rights', {
            year,
            name: language === 'ar' ? brand.nameAr : brand.nameEn,
          })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.aubergineDeep,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manifesto: {
    maxWidth: 320,
    lineHeight: 42,
  },
  description: {
    maxWidth: 330,
  },
  columns: {
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  column: {
    flex: 1,
    gap: 9,
    alignItems: 'flex-start',
  },
  columnTitle: {
    marginBottom: 3,
  },
  link: {
    paddingVertical: 3,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  unavailable: {
    fontSize: 9,
    lineHeight: 14,
    maxWidth: 150,
    opacity: 0.8,
  },
  contactRow: {
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.8,
  },
  payment: {
    maxWidth: 340,
  },
});
