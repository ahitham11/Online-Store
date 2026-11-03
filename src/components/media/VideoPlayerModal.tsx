import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { BrandVideo } from '@/data/media';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/** Full-screen player. The video only downloads once this opens. */
export function VideoPlayerModal({ video, onClose }: { video: BrandVideo | null; onClose: () => void }) {
  return (
    <Modal visible={!!video} animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      {video ? <Player video={video} onClose={onClose} /> : null}
    </Modal>
  );
}

function Player({ video, onClose }: { video: BrandVideo; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, localized, isRTL } = useI18n();
  const player = useVideoPlayer(video.source, (p) => {
    p.loop = true;
    p.play();
  });
  // On web the <video> element may attach after setup runs; start once it's ready.
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' && !player.playing) player.play();
    });
    return () => sub.remove();
  }, [player]);

  return (
    <View style={styles.root}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm, flexDirection: isRTL ? 'row-reverse' : 'row' }]} pointerEvents="box-none">
        <AppText variant="subtitle" numberOfLines={1} style={styles.title} maxScale={1.2}>
          {localized(video.titleAr, video.titleEn)}
        </AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={10} style={styles.close}>
          <Icon name="close" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      {video.productId ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing['3xl'] }]} pointerEvents="box-none">
          <Button
            label={t('media.shopThis')}
            icon="bag"
            fullWidth={false}
            onPress={() => {
              onClose();
              router.push(`/product/${video.productId}`);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  title: { flex: 1, color: '#FFFFFF' },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
});
