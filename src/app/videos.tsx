import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/chrome/StackHeader';
import { VideoPlayerModal } from '@/components/media/VideoPlayerModal';
import { VideoTile } from '@/components/media/VideoTile';
import { CardGrid, useCardWidth } from '@/components/ui/CardGrid';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { productVideos, storyVideos, type BrandVideo } from '@/data/media';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/theme/tokens';

export default function VideosScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const cardWidth = useCardWidth();
  const [open, setOpen] = useState<BrandVideo | null>(null);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader title={t('media.allTitle')} eyebrow={t('media.eyebrow')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
        <SectionHeader eyebrow={t('media.eyebrow')} title={t('media.title')} />
        <CardGrid>
          {productVideos.map((video) => (
            <VideoTile key={video.id} video={video} width={cardWidth} onPlay={setOpen} />
          ))}
        </CardGrid>
        <View style={styles.gap} />
        <SectionHeader eyebrow={t('media.storyEyebrow')} title={t('media.storyTitle')} />
        <CardGrid>
          {storyVideos.map((video) => (
            <VideoTile key={video.id} video={video} width={cardWidth} onPlay={setOpen} />
          ))}
        </CardGrid>
      </ScrollView>
      <VideoPlayerModal video={open} onClose={() => setOpen(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  gap: { height: spacing.xl },
});
