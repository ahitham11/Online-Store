import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { usePreferencesStore } from '@/stores/preferences';

/**
 * Combines the system Reduce Motion setting with the owner override used by
 * the motion lab. When true, decorative motion is removed and the app keeps
 * only short opacity changes.
 */
export function useReducedMotion() {
  const override = usePreferencesStore((state) => state.reduceMotionOverride);
  const [systemReduce, setSystemReduce] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    }
    return false;
  });

  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      const listener = (event: MediaQueryListEvent) => setSystemReduce(event.matches);
      media?.addEventListener?.('change', listener);
      return () => media?.removeEventListener?.('change', listener);
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setSystemReduce(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) setSystemReduce(enabled);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return override ?? systemReduce;
}
