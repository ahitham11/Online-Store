import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/BrandMark';
import { StackHeader } from '@/components/chrome/StackHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon } from '@/components/ui/Icon';
import { brand } from '@/data/brand';
import { isPolicySlug, policyDocuments, type PolicySlug } from '@/data/policies';
import { hapticTap } from '@/lib/haptics';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { hairline, radii, spacing } from '@/theme/tokens';

const policyTitle: Record<PolicySlug, TranslationKey> = {
  shipping: 'footer.shipping',
  returns: 'footer.returns',
  privacy: 'footer.privacy',
  terms: 'footer.terms',
};

export default function PolicyScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const rawSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slug = rawSlug && isPolicySlug(rawSlug) ? rawSlug : null;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, language } = useI18n();

  const document = slug ? policyDocuments[slug] : null;
  const title = slug ? t(policyTitle[slug]) : t('policies.eyebrow');

  if (!document) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <StackHeader title={title} eyebrow={t('policies.eyebrow')} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['4xl'] },
          ]}>
          <EmptyState
            eyebrow={t('policies.eyebrow')}
            title={t('notFound.title')}
            body={t('notFound.body')}
            actionLabel={t('notFound.cta')}
            onAction={() => router.replace('/')}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader title={title} eyebrow={t('policies.eyebrow')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['4xl'] },
        ]}>
        <View style={styles.heading}>
          <BrandMark variant="monogram" size={0.9} tone="gold" />
          <AppText variant="displaySmall" style={styles.title} maxScale={1.2}>
            {title}
          </AppText>
          <GoldRule width="32%" />
          {document.updatedAt ? (
            <AppText variant="caption" tone="tertiary" maxScale={1.2}>
              {new Date(document.updatedAt).toLocaleDateString(
                language === 'ar' ? 'ar-EG' : 'en-GB',
              )}
            </AppText>
          ) : null}
        </View>

        {document.published && document.paragraphs.length > 0 ? (
          <View
            style={[
              styles.paper,
              { borderColor: colors.goldLine, backgroundColor: colors.surface },
            ]}>
            {document.paragraphs.map((paragraph, index) => (
              <AppText
                key={`${document.slug}-${index}`}
                variant="body"
                tone="secondary"
                style={styles.paragraph}
                maxScale={1.35}>
                {paragraph}
              </AppText>
            ))}
          </View>
        ) : (
          <EmptyState
            title={t('policies.emptyTitle')}
            body={t('policies.emptyBody')}
            actionLabel={t('footer.contact')}
            onAction={() => Linking.openURL(brand.instagramUrl).catch(() => undefined)}
          />
        )}

        <View
          style={[
            styles.contact,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <AppText variant="label" tone="accent" style={styles.contactLabel} maxScale={1.2}>
            {t('policies.contact')}
          </AppText>
          <Button
            label={`@${brand.handle}`}
            variant="ghost"
            size="sm"
            fullWidth={false}
            icon="instagram"
            onPress={() => {
              hapticTap();
              Linking.openURL(brand.instagramUrl).catch(() => undefined);
            }}
          />
          <View style={[styles.contactRow, { borderColor: colors.border }]}>
            <Icon name="shield" size={14} color={colors.textTertiary} />
            <AppText variant="caption" tone="tertiary" style={styles.contactNote} maxScale={1.2}>
              {t('common.notConfigured')}
            </AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  paper: {
    borderRadius: radii['2xl'],
    borderWidth: hairline,
    padding: spacing.xl,
    gap: spacing.base,
  },
  paragraph: {
    lineHeight: 26,
  },
  contact: {
    borderRadius: radii['2xl'],
    borderWidth: hairline,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactLabel: {
    letterSpacing: 1.4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: hairline,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    width: '100%',
    justifyContent: 'center',
  },
  contactNote: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
