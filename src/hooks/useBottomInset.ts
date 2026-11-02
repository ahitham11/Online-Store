import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/theme/tokens';

/** Space a screen needs so its last row clears the floating tab bar. */
export function useBottomInset(extra = 0) {
  const insets = useSafeAreaInsets();
  return layout.tabBarHeight + layout.tabBarBottomGap + insets.bottom + extra;
}
