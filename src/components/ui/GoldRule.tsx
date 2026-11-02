import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/theme';

type Props = {
  width?: number | `${number}%`;
  color?: string;
  diamond?: boolean;
  style?: object;
};

export function GoldRule({ width = '100%', color, diamond = true, style }: Props) {
  const { colors } = useTheme();
  const lineColor = color ?? colors.goldLine;
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.line, { backgroundColor: lineColor }]} />
      {diamond ? <View style={[styles.diamond, { backgroundColor: colors.accent, transform: [{ rotate: '45deg' }] }]} /> : null}
      <View style={[styles.line, { backgroundColor: lineColor, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  line: {
    flexGrow: 1,
    height: StyleSheet.hairlineWidth,
  },
  diamond: {
    width: 4,
    height: 4,
    opacity: 0.9,
  },
});
