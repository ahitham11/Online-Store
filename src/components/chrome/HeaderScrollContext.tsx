import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Home publishes its vertical scroll offset here so the floating header can
 * turn from transparent hero chrome into a dark glass bar without re-rendering
 * the tree on every frame.
 */
export const HeaderScrollContext = createContext<SharedValue<number> | null>(null);

export function useHeaderScroll() {
  return useContext(HeaderScrollContext);
}
