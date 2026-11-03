import { palette } from '@/theme/tokens';

/**
 * Provisional identity.
 *
 * The source of truth is catalog/catalog.json + assets/brand/. Those files
 * were not present in the workspace when this phase was built, so the app
 * derives a typographic wordmark and palette from the supplied brief. Set
 * `isProvisional` to false and replace `logoSource` when the real identity
 * lands. Nothing customer-facing is invented beyond the public Instagram
 * handle and the supplied provisional palette.
 */
type BrandConfig = {
  nameAr: string;
  nameEn: string;
  fullName: string;
  handle: string;
  instagramUrl: string;
  whatsapp: string | null;
  descriptionAr: string;
  descriptionEn: string;
  colors: { primary: string; secondary: string; accent: string };
  logoSource: number | null;
  isProvisional: boolean;
  cataloguePath: string;
  brandAssetsPath: string;
};

export const brand: BrandConfig = {
  nameAr: 'VEIVETY',
  nameEn: 'VEIVETY',
  fullName: 'Beauty with VEIVETY',
  handle: 'beautty_with_velvety',
  instagramUrl: 'https://instagram.com/beautty_with_velvety',
  whatsapp: null as string | null,
  descriptionAr: '',
  descriptionEn: '',
  colors: {
    primary: palette.aubergine,
    secondary: palette.rose,
    accent: palette.champagne,
  },
  logoSource: null as number | null,
  isProvisional: true,
  cataloguePath: 'catalog/catalog.json',
  brandAssetsPath: 'assets/brand/',
} as const;

export function getWhatsAppUrl(message?: string): string | null {
  if (!brand.whatsapp) return null;
  const digits = brand.whatsapp.replace(/[^\d]/g, '');
  if (!digits) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${query}`;
}
