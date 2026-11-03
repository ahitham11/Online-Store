import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import type { BrandVideo } from '@/data/media';
import { useCatalog } from '@/data/useCatalog';
import { useMarket } from '@/hooks/useMarket';
import { formatPrice } from '@/lib/format';
import { hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { defaultVariant, priceFor } from '@/lib/variants';
import { radii, spacing } from '@/theme/tokens';

/**
 * A video card built on the exact same frame as ProductCard (same image
 * ratio, same three text lines, same price row) so videos and products line
 * up in one grid. Tapping opens the full-screen player.
 */
export function VideoTile({ video, width, onPlay }: { video: BrandVideo; width: number; onPlay: (video: BrandVideo) => void }) {
  const { colors } = useTheme();
  const { t, language, localized } = useI18n();
  const market = useMarket();
  const product = useCatalog().data.products.find((p) => p.id === video.productId) ?? null;
  const price = product ? priceFor(defaultVariant(product, market.code), market.code) : null;
  const title = localized(video.titleAr, video.titleEn);
  const play = () => {
    hapticTap();
    onPlay(video);
  };

  return (
    <View style={[styles.card, { width, backgroundColor: colors.surface, borderColor: colors.goldLine }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t('media.play')}: ${title}`} onPress={play} style={styles.imageArea}>
        <Image source={{ uri: video.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
        <View style={styles.center}>
          <View style={[styles.playBig, { backgroundColor: 'rgba(255,251,250,0.9)' }]}>
            <Icon name="play" size={22} color={colors.primary} />
          </View>
        </View>
      </Pressable>
      <View style={styles.copy}>
        <AppText variant="label" tone="accent" style={styles.tag} numberOfLines={1} maxScale={1.2}>
          {t('media.tag')}
        </AppText>
        <AppText variant="subtitle" style={styles.name} numberOfLines={1} maxScale={1.25}>
          {title}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1} maxScale={1.2}>
          {product ? localized(product.nameAr, product.nameEn) : 'VEIVETY'}
        </AppText>
        <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
          <AppText variant="price" style={styles.price} numberOfLines={1} maxScale={1.2}>
            {price !== null ? formatPrice(price, market.code, language) : t('media.watch')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('media.play')}: ${title}`}
            onPress={play}
            style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
            <Icon name="play" size={15} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Mirrors ProductCard's measurements.
const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  imageArea: { width: '100%', aspectRatio: 0.92, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  playBig: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  copy: { padding: spacing.md, gap: 5 },
  tag: { fontSize: 8, letterSpacing: 1.2 },
  name: { fontSize: 15, lineHeight: 22 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  price: { fontSize: 16, lineHeight: 21, flexShrink: 1 },
  button: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
