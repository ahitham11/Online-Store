import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";

import { Monogram } from "@/components/brand/BrandMark";
import { Footer } from "@/components/chrome/Footer";
import { useHeaderScroll } from "@/components/chrome/HeaderScrollContext";
import { HeroSlider, type VelvetSlide } from "@/components/home/HeroSlider";
import { AmbientVideo } from "@/components/media/AmbientVideo";
import { ProductCard } from "@/components/product/ProductCard";
import { AppText } from "@/components/ui/AppText";
import { CardGrid, useCardWidth } from "@/components/ui/CardGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { ambientClips } from "@/data/media";
import { useCatalog } from "@/data/useCatalog";
import { useBottomInset } from "@/hooks/useBottomInset";
import { useMarket } from "@/hooks/useMarket";
import { formatPrice } from "@/lib/format";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { fromPrice } from "@/lib/variants";
import { layout, radii, spacing } from "@/theme/tokens";

type Anchor = "categories" | "new";

const services: { icon: IconName; title: TranslationKey; body: TranslationKey }[] = [
  { icon: "box", title: "home.serviceCodTitle", body: "home.serviceCodBody" },
  { icon: "truck", title: "home.serviceShipTitle", body: "home.serviceShipBody" },
  { icon: "whatsapp", title: "home.serviceHelpTitle", body: "home.serviceHelpBody" },
];

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { t, localized, isRTL, language } = useI18n();
  const bottomInset = useBottomInset(spacing.xl);
  const catalog = useCatalog();
  const market = useMarket();
  const scrollY = useHeaderScroll();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const anchors = useRef<Partial<Record<Anchor, number>>>({});
  const [slideIndex, setSlideIndex] = useState(0);

  const heroHeight = Math.min(Math.max(height * 0.72, 520), 700);
  const gutter = width > 760 ? (width - 720) / 2 : spacing.xl;
  const cardWidth = useCardWidth(gutter);
  const contentWidth = width - gutter * 2;
  const tileWidth = Math.floor((contentWidth - spacing.md * 2) / 3);

  const { products, categories, heroSlides } = catalog.data;

  const slides = useMemo<VelvetSlide[]>(() => {
    const priceOf = (productId: string | null) => {
      const product = products.find((p) => p.id === productId);
      const price = product ? fromPrice(product, market.code) : null;
      return price === null ? "" : formatPrice(price, market.code, language);
    };
    if (heroSlides.length > 0) {
      return heroSlides.map((slide) => ({
        id: slide.id,
        imageUri: slide.image,
        anchor: slide.productId ? `product:${slide.productId}` : "new",
        copy: {
          eyebrow: localized(slide.eyebrowAr, slide.eyebrowEn),
          title: localized(slide.titleAr, slide.titleEn),
          body: localized(slide.bodyAr, slide.bodyEn),
          hint: t("home.heroHint"),
          statusLabel: t("home.heroFrom"),
          statusValue: priceOf(slide.productId),
          ctaLabel: t("home.heroCta"),
        },
      }));
    }
    // Shown only for a moment while the catalog loads.
    return [
      {
        id: "welcome",
        anchor: "new",
        copy: {
          eyebrow: t("home.heroEyebrow"),
          title: t("home.heroTitle"),
          body: t("home.heroBody"),
          hint: t("home.heroHint"),
          statusLabel: t("home.heroDelivery"),
          statusValue: t("home.heroCountries"),
          ctaLabel: t("home.heroCta"),
        },
      },
    ];
  }, [heroSlides, products, market.code, language, localized, t]);

  const activeSlide = Math.min(slideIndex, Math.max(slides.length - 1, 0));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design.
      if (scrollY) scrollY.value = event.contentOffset.y;
    },
  });

  const captureAnchor = (anchor: Anchor) => (event: LayoutChangeEvent) => {
    // eslint-disable-next-line react-hooks/refs -- Layout callbacks run after render, not during it.
    anchors.current[anchor] = event.nativeEvent.layout.y;
  };

  const scrollToAnchor = useCallback((anchor?: string) => {
    if (!anchor) return;
    if (anchor.startsWith("product:")) {
      router.push(`/product/${anchor.slice("product:".length)}`);
      return;
    }
    // Old links (?section=offers) land on the products.
    const y = anchors.current[(anchor === "offers" ? "new" : anchor) as Anchor];
    if (typeof y !== "number") return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 72), animated: true });
  }, []);

  // Links such as the drawer's "Offers" open home at a section: /?section=new
  const { section } = useLocalSearchParams<{ section?: string }>();
  useEffect(() => {
    if (!section) return;
    const timer = setTimeout(() => {
      scrollToAnchor(section);
      router.setParams({ section: undefined });
    }, 450);
    return () => clearTimeout(timer);
  }, [scrollToAnchor, section]);

  const topCategories = categories
    .filter((category) => category.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 3);
  const countFor = (categoryId: string) => products.filter((p) => p.categoryId === categoryId).length;
  const loading = catalog.isLoading && products.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset }}
      >
        <View style={{ height: heroHeight }}>
          <HeroSlider
            width={width}
            height={heroHeight}
            slides={slides}
            index={activeSlide}
            onChange={setSlideIndex}
            onCta={(slide) => scrollToAnchor(slide.anchor)}
          />
        </View>

        {catalog.isError && products.length === 0 ? (
          <View style={[styles.section, { paddingHorizontal: gutter }]}>
            <EmptyState
              eyebrow={t("common.errorTitle")}
              title={t("common.errorBody")}
              actionLabel={t("common.retry")}
              onAction={() => catalog.refetch()}
            />
          </View>
        ) : null}

        {/* Categories: three equal tiles */}
        <View onLayout={captureAnchor("categories")} style={[styles.section, { paddingHorizontal: gutter }]}>
          <SectionHeader
            eyebrow={t("home.categoriesEyebrow")}
            title={t("home.categoriesTitle")}
            actionLabel={t("common.viewAll")}
            onAction={() => router.push("/categories")}
          />
          <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {loading
              ? [0, 1, 2].map((i) => <SkeletonBlock key={i} width={tileWidth} height={tileWidth + 52} radius={radii.lg} />)
              : topCategories.map((category) => {
                  const name = localized(category.nameAr, category.nameEn);
                  const count = countFor(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${name}, ${t("categories.productCount", { count })}`}
                      onPress={() => router.push(`/category/${category.id}`)}
                      style={({ pressed }) => [
                        styles.categoryTile,
                        { width: tileWidth, borderColor: colors.goldLine, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <View style={[styles.categoryImage, { backgroundColor: colors.bgAlt }]}>
                        {category.image ? (
                          <Image source={{ uri: category.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
                        ) : (
                          <Monogram size={28} color={colors.textTertiary} gold={colors.goldLine} />
                        )}
                      </View>
                      <View style={styles.categoryCopy}>
                        <AppText variant="subtitle" align="center" numberOfLines={2} style={styles.categoryName} maxScale={1.2}>
                          {name}
                        </AppText>
                        <AppText variant="caption" tone="tertiary" align="center" numberOfLines={1} maxScale={1.2}>
                          {t("categories.productCount", { count })}
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
          </View>
        </View>

        {/* Products: same-size cards */}
        <View onLayout={captureAnchor("new")} style={[styles.section, { paddingHorizontal: gutter }]}>
          <SectionHeader
            eyebrow={t("home.newEyebrow")}
            title={t("home.newTitle")}
            actionLabel={t("common.viewAll")}
            onAction={() => router.push("/categories")}
          />
          <View style={styles.block}>
            <CardGrid>
              {loading
                ? [0, 1, 2, 3].map((i) => <SkeletonBlock key={i} width={cardWidth} height={cardWidth * 1.09 + 128} radius={radii.lg} />)
                : products.map((product) => <ProductCard key={product.id} product={product} width={cardWidth} />)}
            </CardGrid>
          </View>
        </View>

        {/* Brand band: a faint clip moving behind the words, like the hero */}
        <View style={[styles.band, { marginTop: spacing["3xl"] }]}>
          <AmbientVideo clip={ambientClips.redLip} strength={isDark ? 0.2 : 0.3} />
          <View style={[styles.bandCopy, { paddingHorizontal: gutter }]}>
            <AppText variant="label" tone="accent" align="center" style={styles.bandEyebrow} maxScale={1.2}>
              {t("home.bandEyebrow")}
            </AppText>
            <AppText variant="displaySmall" align="center" style={styles.bandTitle} maxScale={1.15}>
              {t("home.bandTitle")}
            </AppText>
            <AppText variant="body" tone="secondary" align="center" style={styles.bandBody} maxScale={1.3}>
              {t("home.bandBody")}
            </AppText>
            <Button
              label={t("home.heroCta")}
              fullWidth={false}
              icon="arrow"
              iconPosition="end"
              onPress={() => router.push("/categories")}
            />
          </View>
        </View>

        {/* Service promises: three equal tiles over a second faint clip */}
        <View style={[styles.section, styles.serviceSection, { paddingHorizontal: gutter }]}>
          <AmbientVideo clip={ambientClips.berry} strength={isDark ? 0.1 : 0.14} />
          <SectionHeader eyebrow={t("home.serviceEyebrow")} title={t("home.serviceTitle")} />
          <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {services.map((service) => (
              <View key={service.title} style={[styles.serviceTile, { width: tileWidth, borderColor: colors.goldLine, backgroundColor: colors.surface }]}>
                <View style={[styles.serviceIcon, { backgroundColor: colors.bgAlt }]}>
                  <Icon name={service.icon} size={18} color={colors.primary} />
                </View>
                <AppText variant="bodySmall" align="center" numberOfLines={2} style={styles.serviceTitle} maxScale={1.2}>
                  {t(service.title)}
                </AppText>
                <AppText variant="caption" tone="tertiary" align="center" numberOfLines={3} maxScale={1.2}>
                  {t(service.body)}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerGap} />
        <Footer />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { paddingTop: spacing["3xl"] },
  block: { marginTop: spacing.lg },
  row: { marginTop: spacing.lg, gap: spacing.md, alignItems: "stretch" },
  categoryTile: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  categoryCopy: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, gap: 2 },
  // Room for two lines on every tile keeps the three tiles the same height.
  categoryName: { fontSize: 14, lineHeight: 20, height: 40, textAlignVertical: "center" },
  serviceTile: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: spacing.xs,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  serviceTitle: { fontSize: 13, lineHeight: 19 },
  band: { minHeight: 420, justifyContent: "center", overflow: "hidden" },
  bandCopy: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["4xl"] },
  bandEyebrow: { letterSpacing: 2 },
  bandTitle: { maxWidth: 360 },
  bandBody: { maxWidth: 340, marginBottom: spacing.sm },
  serviceSection: { paddingBottom: spacing["2xl"], overflow: "hidden" },
  footerGap: { height: spacing["3xl"] + layout.tabBarHeight },
});
