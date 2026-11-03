/**
 * Brand videos, compressed for mobile (540px H.264, fast start, Instagram
 * outro trimmed) and served from public/media on Expo Hosting. Pages show
 * only the poster; a video is downloaded only when the shopper taps it.
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
  /** `product`: shows a shade or look; `story`: the brand behind it. */
  kind: 'product' | 'story';
  productId?: string;
};

const PORTRAIT = 9 / 16;

function clip(id: string, titleAr: string, titleEn: string, kind: BrandVideo['kind'], productId?: string, aspect = PORTRAIT): BrandVideo {
  return { id, titleAr, titleEn, kind, productId, aspect, poster: `${BASE}/${id}.webp`, source: `${BASE}/${id}.mp4` };
}

export const brandVideos: BrandVideo[] = [
  clip('red-lip', 'إطلالة الأحمر الجريء', 'The bold red look', 'product', 'lip-gloss'),
  clip('crystal-clear', '13 كريستال كلير', '13 Crystal Clear', 'product', 'lip-gloss'),
  clip('gloss-swatches', 'تجربة درجات الجلوس', 'Gloss shades, tried on', 'product', 'lip-gloss'),
  clip('doaa-review', 'رأي دعاء', "Doaa's first look", 'product', 'lip-gloss'),
  clip('model-eso', 'عارضتنا', 'Our model', 'product', 'lip-liner'),
  clip('liner-swatches', 'درجات محدد الشفاه', 'Lip liner swatches', 'product', 'lip-liner'),
  clip('sweet-life', 'ثنائي الشفاه', 'Lip combo', 'product', 'lip-combo', 3 / 4),
  clip('blush-stick-review', 'تجربة البلاشر ستيك', 'Blush stick, tried on', 'product', 'blush-stick'),
  clip('berry-juicy', 'بلاشر بيري جوسي', 'Berry Juicy blush', 'product', 'powder-blush'),
  clip('our-story', 'VEIVETY قصتي', 'VEIVETY is my story', 'story', undefined, 16 / 9),
  clip('coming-soon', 'قريباً', 'Coming soon', 'story'),
  clip('backstage', 'كواليس التصوير', 'Behind the shoot', 'story'),
  clip('teaser', 'الإعلان التشويقي', 'The teaser', 'story'),
];

export const productVideos = brandVideos.filter((v) => v.kind === 'product');
export const storyVideos = brandVideos.filter((v) => v.kind === 'story');
export const videosForProduct = (productId: string) => productVideos.filter((v) => v.productId === productId);
