/**
 * Short, silent background clips (480px, 10 s, no sound, about 330 KB each)
 * served from public/media on Expo Hosting. They play faintly behind a
 * section, like the hero; the poster shows until the clip is ready.
 */
const BASE = 'https://velvety-atelier.expo.app/media';

export type AmbientClip = { source: string; poster: string };

export const ambientClips = {
  redLip: { source: `${BASE}/bg-red-lip.mp4`, poster: `${BASE}/bg-red-lip.webp` },
  berry: { source: `${BASE}/bg-berry.mp4`, poster: `${BASE}/bg-berry.webp` },
} satisfies Record<string, AmbientClip>;
