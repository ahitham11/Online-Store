import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import type { BrandVideo } from '@/data/media';
import { hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { hairline, radii, spacing } from '@/theme/tokens';

type Props = { video: BrandVideo; width: number };

/**
 * Poster first; the player (and the video download) only exists after a tap,
 * so a page with several videos costs no more than a few small images.
 */
export function VideoCard({ video, width }: Props) {
  const { colors } = useTheme();
  const { t, localized } = useI18n();
  const [playing, setPlaying] = useState(false);
  const height = width / video.aspect;
  const title = localized(video.titleAr, video.titleEn);

  return (
    <View style={[styles.card, { width, borderColor: colors.goldLine, backgroundColor: colors.surface }]}>
      <View style={[styles.frame, { height, backgroundColor: colors.bgAlt }]}>
        {playing ? (
          <InlinePlayer source={video.source} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('media.play')}: ${title}`}
            onPress={() => {
              hapticTap();
              setPlaying(true);
            }}
            style={StyleSheet.absoluteFill}>
            <Image source={{ uri: video.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
            <View style={styles.playWrap}>
              <View style={[styles.play, { backgroundColor: 'rgba(255,251,250,0.88)' }]}>
                <Icon name="play" size={20} color={colors.primary} />
              </View>
            </View>
          </Pressable>
        )}
      </View>
      <View style={styles.footer}>
        <AppText variant="subtitle" numberOfLines={1} style={styles.title} maxScale={1.2}>
          {title}
        </AppText>
        {video.productId ? (
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push(`/product/${video.productId}`)}>
            <AppText variant="caption" tone="accent" maxScale={1.2}>
              {t('media.shop')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function InlinePlayer({ source }: { source: string }) {
  const player = useVideoPlayer(source, (p) => {
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
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls fullscreenOptions={{ enable: true }} />;
}

const styles = StyleSheet.create({
  card: { borderWidth: hairline, borderRadius: radii.xl, overflow: 'hidden' },
  frame: { width: '100%', overflow: 'hidden' },
  playWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  play: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.md },
  title: { flex: 1 },
});
