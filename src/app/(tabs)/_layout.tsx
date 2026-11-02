import { Tabs } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppHeader } from '@/components/chrome/AppHeader';
import { Drawer } from '@/components/chrome/Drawer';
import { FloatingTabBar } from '@/components/chrome/FloatingTabBar';
import { HeaderScrollContext } from '@/components/chrome/HeaderScrollContext';
import { OfflineBanner } from '@/components/chrome/OfflineBanner';
import { OpeningVeil } from '@/components/motion/OpeningVeil';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { usePreferencesStore } from '@/stores/preferences';
import { useUiStore } from '@/stores/ui';
import { motion } from '@/theme/tokens';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  const drawerOpen = useUiStore((state) => state.drawerOpen);
  const showOpening = useUiStore((state) => state.openingVisible);
  const forceFullOpening = useUiStore((state) => state.openingForceFull);
  const finishOpeningState = useUiStore((state) => state.finishOpening);
  const markOpeningSeen = usePreferencesStore((state) => state.markOpeningSeen);
  const hasSeenOpening = usePreferencesStore((state) => state.hasSeenOpening);
  const scrollY = useSharedValue(0);
  const drawerProgress = useSharedValue(0);

  useEffect(() => {
    drawerProgress.value = withTiming(drawerOpen ? 1 : 0, {
      duration: drawerOpen ? motion.base : motion.fast,
      easing: Easing.bezier(...motion.easing),
    });
  }, [drawerOpen, drawerProgress]);

  const finishOpening = useCallback(() => {
    markOpeningSeen();
    finishOpeningState();
  }, [finishOpeningState, markOpeningSeen]);

  const contentStyle = useAnimatedStyle(() => {
    const direction = isRTL ? 1 : -1;
    return {
      transform: [
        { perspective: 1400 },
        { translateX: direction * drawerProgress.value * 64 },
        { rotateY: `${direction * drawerProgress.value * 7}deg` },
        { scale: 1 - drawerProgress.value * 0.045 },
      ],
      borderRadius: drawerProgress.value * 30,
    };
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <HeaderScrollContext.Provider value={scrollY}>
        <Animated.View
          style={[styles.content, contentStyle]}
          pointerEvents={drawerOpen ? 'none' : 'auto'}>
          <Tabs
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              sceneStyle: { backgroundColor: colors.bg },
            }}
            tabBar={() => <FloatingTabBar />}
            backBehavior="history">
            <Tabs.Screen name="index" />
            <Tabs.Screen name="categories" />
            <Tabs.Screen name="wishlist" />
            <Tabs.Screen name="bag" />
            <Tabs.Screen name="account" />
          </Tabs>
          <AppHeader />
          <OfflineBanner />
        </Animated.View>
      </HeaderScrollContext.Provider>

      <Drawer />

      {showOpening ? (
        <OpeningVeil
          brief={hasSeenOpening && !forceFullOpening}
          onDone={finishOpening}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});
