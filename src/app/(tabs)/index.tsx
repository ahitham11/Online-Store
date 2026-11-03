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
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { Footer } from "@/components/chrome/Footer";
import { VideoRail } from "@/components/media/VideoRail";
import { productVideos, storyVideos } from "@/data/media";
import { GrainOverlay } from "@/components/chrome/GrainOverlay";
import { useHeaderScroll } from "@/components/chrome/HeaderScrollContext";
import { HeroSlider, type VelvetSlide } from "@/components/home/HeroSlider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Ornament } from "@/components/ui/Ornament";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GoldRule } from "@/components/ui/GoldRule";
import { Icon } from "@/components/ui/Icon";
import { useBottomInset } from "@/hooks/useBottomInset";
import { useCatalog } from "@/data/useCatalog";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { layout, palette, radii, spacing, typeScale } from "@/theme/tokens";

type Anchor = "principles" | "categories" | "new" | "offers" | "atelier";

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { t, localized, isRTL } = useI18n();
  const bottomInset = useBottomInset(spacing.xl);
  const catalog = useCatalog();
  const scrollY = useHeaderScroll();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const anchors = useRef<Partial<Record<Anchor, number>>>({});
  const [slideIndex, setSlideIndex] = useState(0);

  const heroHeight = Math.min(Math.max(height * 0.84, 548), 760);
  const gutter = width > 760 ? (width - 720) / 2 : spacing.xl;

  const slides = useMemo<VelvetSlide[]>(() => {
    if (catalog.data.heroSlides.length > 0) {
      return catalog.data.heroSlides.map((slide) => ({
        id: slide.id,
        imageUri: slide.image,
        copy: {
          eyebrow:
            localized(slide.eyebrowAr, slide.eyebrowEn) ||
            t("home.heroEyebrow"),
          title: localized(slide.titleAr, slide.titleEn),
          body: localized(slide.bodyAr, slide.bodyEn) || t("home.heroBody"),
          hint: t("home.heroHint"),
          statusLabel: t("home.heroStatus"),
          statusValue: t("product.inStock"),
          ctaLabel: t("common.viewAll"),
        },
      }));
    }

    return [
      {
        id: "house-1",
        anchor: "principles",
        copy: {
          eyebrow: t("home.heroEyebrow"),
          title: t("home.heroTitle"),
          body: t("home.heroBody"),
          hint: t("home.heroHint"),
          statusLabel: t("home.heroStatus"),
          statusValue: t("home.heroStatusPending"),
          ctaLabel: t("home.heroCta"),
        },
      },
      {
        id: "house-2",
        anchor: "principles",
        copy: {
          eyebrow: t("home.chapterEyebrow"),
          title: t("home.chapterTitle"),
          body: t("home.chapterBody"),
          hint: t("home.heroHint"),
          statusLabel: t("home.principleLabel"),
          statusValue: t("home.principleCatalogValue"),
          ctaLabel: t("home.readNote"),
        },
      },
      {
        id: "house-3",
        anchor: "categories",
        copy: {
          eyebrow: t("home.atelierEyebrow"),
          title: t("home.atelierTitle"),
          body: t("home.atelierBody"),
          hint: t("home.dragHint"),
          statusLabel: t("home.principleLabel"),
          statusValue: t("home.manifestoLine"),
          ctaLabel: t("home.categoriesCta"),
        },
      },
    ];
  }, [catalog.data.heroSlides, localized, t]);

  const activeSlide =
    slides.length === 0 ? 0 : Math.min(slideIndex, slides.length - 1);

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
    const y = anchors.current[anchor as Anchor];
    if (typeof y !== "number") return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 72), animated: true });
  }, []);

  // Links such as the drawer's "Offers" open home at a section: /?section=offers
  const { section } = useLocalSearchParams<{ section?: string }>();
  useEffect(() => {
    if (!section) return;
    const timer = setTimeout(() => {
      scrollToAnchor(section);
      router.setParams({ section: undefined });
    }, 450);
    return () => clearTimeout(timer);
  }, [scrollToAnchor, section]);

  const principles = [
    {
      number: "01",
      label: t("home.principleCatalog"),
      value: t("home.principleCatalogValue"),
    },
    {
      number: "02",
      label: t("home.principlePrice"),
      value: t("home.principlePriceValue"),
    },
    {
      number: "03",
      label: t("home.principleStock"),
      value: t("home.principleStockValue"),
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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

        {catalog.isError ? (
          <View style={[styles.section, { paddingHorizontal: gutter }]}>
            <EmptyState
              eyebrow={t("common.errorTitle")}
              title={t("common.errorBody")}
              actionLabel={t("common.retry")}
              onAction={() => catalog.refetch()}
            />
          </View>
        ) : null}

        {/* Measured outside Reveal so the offset is relative to the scroll content. */}
        <View onLayout={captureAnchor("principles")}>
          <Reveal delay={40}>
            <View style={[styles.section, { paddingHorizontal: gutter }]}>
              <SectionHeader
                eyebrow={t("home.chapterEyebrow")}
                title={t("home.chapterTitle")}
              />
              <AppText
                variant="body"
                tone="secondary"
                style={[styles.sectionBody, { paddingHorizontal: 4 }]}
                maxScale={1.3}
              >
                {t("home.chapterBody")}
              </AppText>

              <View
                style={[
                  styles.principlePanel,
                  {
                    borderColor: colors.goldLine,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                {principles.map((principle, index) => (
                  <View key={principle.number}>
                    <View
                      style={[
                        styles.principleRow,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <AppText
                        variant="label"
                        tone="accent"
                        style={styles.principleNumber}
                        maxScale={1.2}
                      >
                        {principle.number}
                      </AppText>
                      <View style={styles.principleCopy}>
                        <AppText
                          variant="caption"
                          tone="tertiary"
                          maxScale={1.2}
                        >
                          {principle.label}
                        </AppText>
                        <AppText
                          variant="subtitle"
                          style={styles.principleValue}
                          maxScale={1.25}
                        >
                          {principle.value}
                        </AppText>
                      </View>
                      <Icon name="check" size={15} color={colors.accentText} />
                    </View>
                    {index < principles.length - 1 ? (
                      <View
                        style={[
                          styles.hairline,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          </Reveal>
        </View>

        <View
          onLayout={captureAnchor("categories")}
          style={[styles.section, { paddingHorizontal: gutter }]}
        >
          <SectionHeader
            eyebrow={t("home.categoriesEyebrow")}
            title={t("home.categoriesTitle")}
            actionLabel={t("common.viewAll")}
            onAction={() => router.push("/categories")}
          />
          <View style={styles.sectionBlock}>
            <EmptyState
              compact
              title={t("home.categoriesEmptyTitle")}
              body={t("home.categoriesEmptyBody")}
              actionLabel={t("home.categoriesCta")}
              onAction={() => router.push("/categories")}
            />
          </View>
        </View>

        <View
          onLayout={captureAnchor("new")}
          style={[styles.section, { paddingHorizontal: gutter }]}
        >
          <SectionHeader
            eyebrow={t("home.newEyebrow")}
            title={t("home.newTitle")}
            actionLabel={t("common.all")}
            onAction={() => router.push("/categories")}
          />
          <View style={styles.sectionBlock}>
            <View
              style={[
                styles.editorialEmpty,
                { borderColor: colors.goldLine, backgroundColor: colors.bgAlt },
              ]}
            >
              <View
                style={[
                  styles.editorialIndex,
                  { borderColor: colors.goldLine },
                ]}
              >
                <AppText
                  variant="displaySmall"
                  tone="accent"
                  font="display"
                  style={styles.indexText}
                  maxScale={1.2}
                >
                  01
                </AppText>
              </View>
              <AppText
                variant="titleSmall"
                align="center"
                style={styles.editorialTitle}
                maxScale={1.25}
              >
                {t("home.newEmptyTitle")}
              </AppText>
              <AppText
                variant="bodySmall"
                tone="secondary"
                align="center"
                style={styles.editorialBody}
                maxScale={1.3}
              >
                {t("home.newEmptyBody")}
              </AppText>
              <Button
                label={t("home.categoriesCta")}
                variant="ghost"
                size="sm"
                fullWidth={false}
                icon="arrow"
                iconPosition="end"
                onPress={() => router.push("/categories")}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: gutter }]}>
          <SectionHeader eyebrow={t("media.eyebrow")} title={t("media.title")} />
          <VideoRail videos={productVideos} />
        </View>

        <View style={[styles.section, { paddingHorizontal: gutter }]}>
          <SectionHeader eyebrow={t("media.storyEyebrow")} title={t("media.storyTitle")} />
          <VideoRail videos={storyVideos} />
        </View>

        <View
          onLayout={captureAnchor("offers")}
          style={[styles.section, { paddingHorizontal: 0 }]}
        >
          <View style={styles.offersPanel}>
            <GrainOverlay opacity={0.06} />
            <View style={{ paddingHorizontal: gutter }}>
              <AppText
                variant="label"
                tone="accent"
                style={styles.darkEyebrow}
                maxScale={1.3}
              >
                {t("home.offersEyebrow")}
              </AppText>
              <AppText
                variant="displaySmall"
                tone="onVeil"
                style={styles.offersTitle}
                maxScale={1.2}
              >
                {t("home.offersTitle")}
              </AppText>
              <GoldRule
                width="26%"
                color="rgba(201,154,134,0.5)"
                style={styles.offersRule}
              />
              <AppText
                variant="body"
                tone="onVeilMuted"
                style={styles.offersBody}
                maxScale={1.3}
              >
                {t("home.offersEmptyBody")}
              </AppText>
              <View style={styles.noCountdown}>
                <View
                  style={[
                    styles.countdownCell,
                    { borderColor: "rgba(201,154,134,0.34)" },
                  ]}
                >
                  <AppText
                    variant="displaySmall"
                    tone="onVeil"
                    style={styles.countdownValue}
                    maxScale={1.1}
                  >
                    —
                  </AppText>
                  <AppText
                    variant="caption"
                    tone="onVeilMuted"
                    style={styles.countdownLabel}
                    maxScale={1.1}
                  >
                    {t("common.comingSoon")}
                  </AppText>
                </View>
                <Icon name="sparkle" size={20} color={palette.champagne} />
                <View
                  style={[
                    styles.countdownCell,
                    { borderColor: "rgba(201,154,134,0.34)" },
                  ]}
                >
                  <AppText
                    variant="displaySmall"
                    tone="onVeil"
                    style={styles.countdownValue}
                    maxScale={1.1}
                  >
                    —
                  </AppText>
                  <AppText
                    variant="caption"
                    tone="onVeilMuted"
                    style={styles.countdownLabel}
                    maxScale={1.1}
                  >
                    {t("common.comingSoon")}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Measured outside Reveal so the offset is relative to the scroll content. */}
        <View onLayout={captureAnchor("atelier")}>
          <Reveal delay={30}>
            <View style={[styles.section, { paddingHorizontal: gutter }]}>
              <View
                style={[
                  styles.atelierPanel,
                  {
                    borderColor: colors.goldLine,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <GrainOverlay opacity={0.045} />
                <View style={styles.atelierOrnament}>
                  <Ornament size={96} />
                </View>
                <AppText
                  variant="label"
                  tone="accent"
                  align="center"
                  style={styles.atelierEyebrow}
                  maxScale={1.3}
                >
                  {t("home.atelierEyebrow")}
                </AppText>
                <AppText
                  variant="title"
                  align="center"
                  style={styles.atelierTitle}
                  maxScale={1.2}
                >
                  {t("home.atelierTitle")}
                </AppText>
                <AppText
                  variant="bodySmall"
                  tone="secondary"
                  align="center"
                  style={styles.atelierBody}
                  maxScale={1.3}
                >
                  {t("home.atelierBody")}
                </AppText>
                <GoldRule width="30%" style={styles.atelierRule} />
                <AppText
                  variant="displaySmall"
                  tone="primary"
                  align="center"
                  style={styles.manifesto}
                  maxScale={1.15}
                >
                  {t("home.manifestoLine")}
                </AppText>
              </View>
            </View>
          </Reveal>
        </View>

        <View
          style={[
            styles.notify,
            {
              marginHorizontal: gutter,
              borderColor: colors.goldLine,
              backgroundColor: isDark ? colors.surface : palette.pearlDeep,
            },
          ]}
        >
          <AppText
            variant="titleSmall"
            align="center"
            style={styles.notifyTitle}
            maxScale={1.2}
          >
            {t("home.notifyTitle")}
          </AppText>
          <AppText
            variant="bodySmall"
            tone="secondary"
            align="center"
            style={styles.notifyBody}
            maxScale={1.3}
          >
            {t("home.notifyBody")}
          </AppText>
          <Button
            label={t("home.categoriesCta")}
            variant="outline"
            size="sm"
            fullWidth={false}
            icon="arrow"
            iconPosition="end"
            onPress={() => router.push("/categories")}
          />
        </View>

        {catalog.isLoading ? (
          <View style={[styles.section, { paddingHorizontal: gutter }]}>
            <SkeletonBlock height={120} radius={radii.lg} />
          </View>
        ) : null}

        <View style={styles.footerGap} />
        <Footer />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  section: {
    paddingTop: spacing["4xl"],
  },
  sectionBody: {
    marginTop: spacing.md,
    maxWidth: 520,
  },
  sectionBlock: {
    marginTop: spacing.lg,
  },
  principlePanel: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    overflow: "hidden",
  },
  principleRow: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  principleNumber: {
    width: 26,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  principleCopy: {
    flex: 1,
    gap: 3,
  },
  principleValue: {
    fontSize: 16,
    lineHeight: 23,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginStart: 38,
  },
  editorialEmpty: {
    borderRadius: radii["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    alignItems: "center",
    gap: spacing.sm,
    overflow: "hidden",
  },
  editorialIndex: {
    width: 52,
    height: 52,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  indexText: {
    fontSize: 18,
    lineHeight: 24,
  },
  editorialTitle: {
    maxWidth: 280,
  },
  editorialBody: {
    maxWidth: 300,
  },
  offersPanel: {
    backgroundColor: palette.aubergineDeep,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing["3xl"],
    overflow: "hidden",
  },
  darkEyebrow: {
    letterSpacing: 2,
  },
  offersTitle: {
    marginTop: spacing.md,
    maxWidth: 420,
    lineHeight: 44,
  },
  offersRule: {
    marginVertical: spacing.lg,
  },
  offersBody: {
    maxWidth: 420,
  },
  noCountdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  countdownCell: {
    width: 78,
    height: 64,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  countdownValue: {
    fontSize: 22,
    lineHeight: 26,
    opacity: 0.7,
  },
  countdownLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  atelierPanel: {
    borderRadius: radii["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    alignItems: "center",
    overflow: "hidden",
  },
  atelierOrnament: {
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  atelierEyebrow: {
    letterSpacing: 2,
  },
  atelierTitle: {
    marginTop: spacing.sm,
    maxWidth: 320,
    fontSize: typeScale.title.fontSize,
  },
  atelierBody: {
    marginTop: spacing.md,
    maxWidth: 330,
  },
  atelierRule: {
    marginVertical: spacing.lg,
  },
  manifesto: {
    fontSize: 30,
    lineHeight: 42,
  },
  notify: {
    marginTop: spacing["4xl"],
    borderRadius: radii["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    alignItems: "center",
    gap: spacing.sm,
  },
  notifyTitle: {
    maxWidth: 300,
  },
  notifyBody: {
    maxWidth: 330,
    marginBottom: spacing.md,
  },
  footerGap: {
    height: spacing["4xl"] + layout.tabBarHeight,
  },
});
