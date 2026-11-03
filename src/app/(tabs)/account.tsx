import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Monogram } from '@/components/brand/BrandMark';
import { Page } from '@/components/chrome/Page';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon, type IconName } from '@/components/ui/Icon';
import { brand, getWhatsAppUrl } from '@/data/brand';
import { policySlugs, type PolicySlug } from '@/data/policies';
import { hapticSelection, hapticTap } from '@/lib/haptics';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useMarket } from '@/hooks/useMarket';
import { MARKET_CODES, markets } from '@/lib/markets';
import { authIsAvailable, useSessionStore } from '@/stores/session';
import type { ThemePreference } from '@/theme/tokens';
import { hairline, radii, spacing } from '@/theme/tokens';

const policyLabel: Record<PolicySlug, TranslationKey> = {
  shipping: 'footer.shipping',
  returns: 'footer.returns',
  privacy: 'footer.privacy',
  terms: 'footer.terms',
};

const policyIcon: Record<PolicySlug, IconName> = {
  shipping: 'truck',
  returns: 'refresh',
  privacy: 'shield',
  terms: 'receipt',
};

export default function AccountScreen() {
  const { colors, preference, setTheme } = useTheme();
  const { t, language, setLanguage, isRTL } = useI18n();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const whatsapp = getWhatsAppUrl();
  const market = useMarket();
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);
  const signedIn = status === 'signedIn';

  const themeOptions: { key: ThemePreference; label: TranslationKey; icon: IconName }[] = [
    { key: 'system', label: 'account.themeSystem', icon: 'settings' },
    { key: 'light', label: 'account.themeLight', icon: 'sun' },
    { key: 'dark', label: 'account.themeDark', icon: 'moon' },
  ];

  return (
    <Page eyebrow={t('account.eyebrow')} title={t('account.title')}>
      <View style={styles.content}>
        <View
          style={[
            styles.guestCard,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <View style={[styles.guestTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Monogram size={56} color={colors.text} gold={colors.accent} />
            <View style={styles.guestCopy}>
              <AppText variant="titleSmall" maxScale={1.2}>
                {signedIn ? t('account.signedInTitle') : t('account.guestTitle')}
              </AppText>
              <AppText variant="bodySmall" tone="secondary" maxScale={1.3} numberOfLines={2}>
                {signedIn ? (user?.email ?? '') : t('account.guestBody')}
              </AppText>
            </View>
          </View>
          {signedIn ? (
            <>
              <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
                {t('account.syncNote')}
              </AppText>
              <Button
                label={t('account.signOut')}
                variant="outline"
                size="sm"
                onPress={() => {
                  hapticTap();
                  signOut().catch(() => undefined);
                }}
              />
            </>
          ) : (
            <>
              <Button
                label={t('account.signIn')}
                icon="user"
                variant="outline"
                size="sm"
                loading={status === 'restoring'}
                disabled={!authIsAvailable}
                accessibilityHint={authIsAvailable ? undefined : t('account.signInSoon')}
                onPress={() => router.push('/sign-in')}
              />
              {!authIsAvailable ? (
                <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
                  {t('account.signInSoon')}
                </AppText>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.group}>
          <GroupTitle label={t('account.orders')} />
          <View
            style={[
              styles.groupBody,
              { borderColor: colors.goldLine, backgroundColor: colors.surface },
            ]}>
            <StaticRow
              icon="receipt"
              title={t('account.guestOrdersTitle')}
              body={t('account.guestOrdersBody')}
            />
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            <StaticRow
              icon="pin"
              title={t('account.addresses')}
              body={t('account.addressesEmpty')}
            />
          </View>
        </View>

        <View style={styles.group}>
          <GroupTitle label={t('account.settings')} />
          <View
            style={[
              styles.groupBody,
              { borderColor: colors.goldLine, backgroundColor: colors.surface },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('account.language')}: ${
                language === 'ar' ? 'العربية' : 'English'
              }`}
              onPress={() => {
                hapticSelection();
                setLanguage(language === 'ar' ? 'en' : 'ar');
              }}
              style={({ pressed }) => [
                styles.actionRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row', opacity: pressed ? 0.65 : 1 },
              ]}>
              <View style={[styles.rowStart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="globe" size={18} color={colors.textSecondary} />
                <AppText variant="body" maxScale={1.3}>
                  {t('account.language')}
                </AppText>
              </View>
              <AppText variant="bodySmall" tone="secondary" maxScale={1.2}>
                {language === 'ar' ? 'العربية' : 'English'}
              </AppText>
            </Pressable>

            <View style={[styles.rule, { backgroundColor: colors.border }]} />

            <View style={styles.themeBlock}>
              <View style={[styles.rowStart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="globe" size={18} color={colors.textSecondary} />
                <AppText variant="body" maxScale={1.3}>
                  {t('account.country')}
                </AppText>
              </View>
              <View
                style={[
                  styles.themeRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: colors.border },
                ]}>
                {MARKET_CODES.map((code) => {
                  const option = markets[code];
                  const active = market.code === code;
                  const label = language === 'ar' ? option.nameAr : option.nameEn;
                  return (
                    <Pressable
                      key={code}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={label}
                      onPress={() => {
                        hapticSelection();
                        market.setMarket(code);
                      }}
                      style={({ pressed }) => [
                        styles.themeOption,
                        {
                          backgroundColor: active ? colors.bgAlt : 'transparent',
                          borderColor: active ? colors.goldLine : 'transparent',
                          opacity: pressed ? 0.66 : 1,
                        },
                      ]}>
                      <AppText variant="body" maxScale={1.1}>
                        {option.flag}
                      </AppText>
                      <AppText variant="caption" tone={active ? 'accent' : 'tertiary'} maxScale={1.15} numberOfLines={1}>
                        {code === 'AE' && language === 'en' ? 'UAE' : label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.rule, { backgroundColor: colors.border }]} />

            <View style={styles.themeBlock}>
              <View style={[styles.rowStart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="sun" size={18} color={colors.textSecondary} />
                <AppText variant="body" maxScale={1.3}>
                  {t('account.theme')}
                </AppText>
              </View>
              <View
                style={[
                  styles.themeRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: colors.border },
                ]}>
                {themeOptions.map((option) => {
                  const active = preference === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={t(option.label)}
                      onPress={() => {
                        hapticSelection();
                        setTheme(option.key);
                      }}
                      style={({ pressed }) => [
                        styles.themeOption,
                        {
                          backgroundColor: active ? colors.bgAlt : 'transparent',
                          borderColor: active ? colors.goldLine : 'transparent',
                          opacity: pressed ? 0.66 : 1,
                        },
                      ]}>
                      <Icon
                        name={option.icon}
                        size={15}
                        color={active ? colors.accentText : colors.textTertiary}
                      />
                      <AppText
                        variant="caption"
                        tone={active ? 'accent' : 'tertiary'}
                        maxScale={1.15}>
                        {t(option.label)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.group}>
          <GroupTitle label={t('account.policies')} />
          <View
            style={[
              styles.groupBody,
              { borderColor: colors.goldLine, backgroundColor: colors.surface },
            ]}>
            {policySlugs.map((slug, index) => (
              <View key={slug}>
                {index > 0 ? (
                  <View style={[styles.rule, { backgroundColor: colors.border }]} />
                ) : null}
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={t(policyLabel[slug])}
                  onPress={() => {
                    hapticTap();
                    router.push(`/policies/${slug}`);
                  }}
                  style={({ pressed }) => [
                    styles.actionRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row', opacity: pressed ? 0.65 : 1 },
                  ]}>
                  <View style={[styles.rowStart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Icon name={policyIcon[slug]} size={17} color={colors.textSecondary} />
                    <AppText variant="body" maxScale={1.3}>
                      {t(policyLabel[slug])}
                    </AppText>
                  </View>
                  <Icon name="chevron" size={14} color={colors.textTertiary} mirrored />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <GroupTitle label={t('footer.follow')} />
          <View style={[styles.socialRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Instagram @${brand.handle}`}
              onPress={() => {
                hapticTap();
                Linking.openURL(brand.instagramUrl).catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.socialButton,
                { borderColor: colors.goldLine, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Icon name="instagram" size={18} color={colors.text} />
              <AppText variant="caption" maxScale={1.15}>
                @{brand.handle}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t('account.whatsapp')}
              accessibilityState={{ disabled: !whatsapp }}
              disabled={!whatsapp}
              onPress={() => {
                if (!whatsapp) return;
                hapticTap();
                Linking.openURL(whatsapp).catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.socialButton,
                {
                  borderColor: colors.goldLine,
                  opacity: !whatsapp ? 0.34 : pressed ? 0.6 : 1,
                },
              ]}>
              <Icon name="whatsapp" size={18} color={colors.text} />
              <AppText variant="caption" maxScale={1.15}>
                {t('account.whatsapp')}
              </AppText>
            </Pressable>
          </View>
          {!whatsapp ? (
            <AppText variant="caption" tone="tertiary" maxScale={1.2}>
              {t('drawer.whatsappUnavailable')}
            </AppText>
          ) : null}
        </View>

        <View style={styles.footer}>
          <GoldRule width="28%" />
          <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
            {t('account.version')} {version}
          </AppText>
          {__DEV__ ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('drawer.motionLab')}
                onPress={() => router.push('/lab')}
                hitSlop={8}
                style={({ pressed }) => [pressed ? { opacity: 0.55 } : null]}>
                <AppText variant="caption" tone="accent" align="center" maxScale={1.2}>
                  {t('drawer.motionLab')}
                </AppText>
              </Pressable>
              <AppText variant="caption" tone="tertiary" align="center" style={styles.staffHint} maxScale={1.2}>
                {t('account.staffHint')}
              </AppText>
            </>
          ) : null}
        </View>
      </View>
    </Page>
  );
}

function GroupTitle({ label }: { label: string }) {
  return (
    <AppText variant="label" tone="accent" style={styles.groupTitle} maxScale={1.2}>
      {label}
    </AppText>
  );
}

function StaticRow({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  return (
    <View style={[styles.staticRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.staticIcon}>
        <Icon name={icon} size={17} color={colors.textTertiary} />
      </View>
      <View style={styles.staticCopy}>
        <AppText variant="body" maxScale={1.3}>
          {title}
        </AppText>
        <AppText variant="caption" tone="tertiary" maxScale={1.25}>
          {body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing['2xl'],
  },
  guestCard: {
    borderRadius: radii['2xl'],
    borderWidth: hairline,
    padding: spacing.lg,
    gap: spacing.md,
  },
  guestTop: {
    alignItems: 'flex-start',
    gap: spacing.base,
  },
  guestCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    letterSpacing: 1.6,
    paddingStart: spacing.xs,
  },
  groupBody: {
    borderRadius: radii.xl,
    borderWidth: hairline,
    paddingHorizontal: spacing.base,
  },
  rule: {
    height: hairline,
  },
  actionRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.base,
  },
  rowStart: {
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  staticRow: {
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.base,
  },
  staticIcon: {
    width: 24,
    paddingTop: 2,
    alignItems: 'center',
  },
  staticCopy: {
    flex: 1,
    gap: 2,
  },
  themeBlock: {
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  themeRow: {
    borderWidth: hairline,
    borderRadius: radii.pill,
    padding: 3,
    gap: 3,
  },
  themeOption: {
    flex: 1,
    borderWidth: hairline,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  socialRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: hairline,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.base,
    height: 42,
    maxWidth: '100%',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  staffHint: {
    opacity: 0.7,
  },
});
