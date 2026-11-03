import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AmbientClip } from '@/data/media';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/lib/theme';

const START_DELAY_MS = 1200;

/**
 * A faint, silent, looping clip behind a section. Not interactive. The poster
 * shows first; the clip starts a moment after the page settles so it never
 * competes with the first paint. With reduced motion only the poster shows.
 */
export function AmbientVideo({ clip, strength = 0.26 }: { clip: AmbientClip; strength?: number }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setReady(true), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  const clear = `${colors.bg}00`;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[StyleSheet.absoluteFill, { opacity: strength }]}>
        <Image source={{ uri: clip.poster }} style={StyleSheet.absoluteFill} contentFit="cover" />
        {ready ? <Loop source={clip.source} /> : null}
      </View>
      {/* Melt the clip into the page at the top and bottom. */}
      <LinearGradient colors={[colors.bg, clear, clear, colors.bg]} locations={[0, 0.22, 0.78, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

function Loop({ source }: { source: string }) {
  const player = useVideoPlayer(source, (p) => {
    p.muted = true;
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
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />;
}
