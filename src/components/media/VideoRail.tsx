import { ScrollView, useWindowDimensions } from 'react-native';

import type { BrandVideo } from '@/data/media';
import { spacing } from '@/theme/tokens';

import { VideoCard } from './VideoCard';

/** Horizontal row of tap-to-play video cards. Short cards keep their own height. */
export function VideoRail({ videos, cardWidth }: { videos: BrandVideo[]; cardWidth?: number }) {
  const { width } = useWindowDimensions();
  const base = cardWidth ?? Math.min(220, width * 0.56);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, alignItems: 'flex-start' }}>
      {videos.map((video) => (
        // Landscape clips get a wider card so they are not tiny.
        <VideoCard key={video.id} video={video} width={video.aspect > 1 ? Math.min(base * 1.6, width * 0.82) : base} />
      ))}
    </ScrollView>
  );
}
