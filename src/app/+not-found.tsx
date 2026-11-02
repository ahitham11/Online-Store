import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/chrome/StackHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader title={t('notFound.title')} eyebrow={t('common.appName')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['4xl'] },
        ]}>
        <EmptyState
          eyebrow={t('notFound.title')}
          title={t('notFound.title')}
          body={t('notFound.body')}
          actionLabel={t('notFound.cta')}
          onAction={() => router.replace('/')}
        />
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
    paddingTop: spacing['4xl'],
  },
});
