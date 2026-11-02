import { Image, StyleSheet, View } from 'react-native';

type Props = {
  opacity?: number;
  tintColor?: string;
};

/**
 * A 96px monochrome grain tile generated at build time. It is deliberately
 * low-opacity so it reads as paper/velvet texture, not noise.
 */
export function GrainOverlay({ opacity = 0.05, tintColor }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wrap]}>
      <Image
        source={require('@/assets/images/grain.png')}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity, tintColor }]}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
