import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import { palette } from '@/theme/tokens';

type Props = {
  count: number;
  index: number;
  onSelect: (index: number) => void;
};

/** Gold ticks with a pearl fill: small, tactile, and never a carousel of dots. */
export function PearlPagination({ count, index, onSelect }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {Array.from({ length: count }).map((_, item) => {
        const active = item === index;
        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item + 1} / ${count}`}
            hitSlop={10}
            onPress={() => onSelect(item)}
            style={styles.hit}>
            <View
              style={[
                styles.tick,
                {
                  width: active ? 26 : 6,
                  backgroundColor: active ? palette.champagneLight : colors.stageTextMuted,
                },
              ]}>
              {active ? <View style={[styles.pearl, { backgroundColor: colors.stageText }]} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hit: {
    paddingVertical: 8,
  },
  tick: {
    height: 2,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pearl: {
    width: 3,
    height: 3,
    borderRadius: 999,
    opacity: 0.8,
  },
});
