/**
 * Brand videos, compressed for mobile (540px H.264, fast start) and served
 * from public/media on Expo Hosting. Pages show only the poster; a video is
 * downloaded only when the shopper taps it.
 */
const BASE = 'https://velvety-atelier.expo.app/media';

export type BrandVideo = {
  id: string;
  titleAr: string;
  titleEn: string;
  poster: string;
  source: string;
  /** width / height */
  aspect: number;
  productId?: string;
};

export const brandVideos: BrandVideo[] = [
  { id: 'studio-clip', titleAr: 'المجموعة الجديدة', titleEn: 'New collection', poster: `${BASE}/studio-clip.webp`, source: `${BASE}/studio-clip.mp4`, aspect: 9 / 16, productId: 'lip-gloss' },
  { id: 'sweet-life', titleAr: 'ثنائي الشفاه', titleEn: 'Lip combo', poster: `${BASE}/sweet-life.webp`, source: `${BASE}/sweet-life.mp4`, aspect: 3 / 4, productId: 'lip-combo' },
  { id: 'model-eso', titleAr: 'عارضتنا', titleEn: 'Our model', poster: `${BASE}/model-eso.webp`, source: `${BASE}/model-eso.mp4`, aspect: 9 / 16, productId: 'lip-liner' },
];
