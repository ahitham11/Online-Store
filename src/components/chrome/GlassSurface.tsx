import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radii } from '@/theme/tokens';

type Props = ViewProps & {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  radius?: number;
  border?: boolean;
  strong?: boolean;
  children: React.ReactNode;
};

export function GlassSurface({
  children,
  style,
  intensity = 38,
  tint,
  radius = radii.xl,
  border = true,
  strong = false,
  ...rest
}: Props) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');
  const backgroundColor = strong ? colors.glassStrong : colors.glass;

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius: radius,
          backgroundColor,
          borderColor: colors.goldLine,
          borderWidth: border ? StyleSheet.hairlineWidth : 0,
        },
        Platform.OS === 'web' && !reducedMotion ? styles.webGlass : null,
        style,
      ]}
      {...rest}>
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={intensity}
          tint={resolvedTint}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: isDark ? 'rgba(22, 10, 19, 0.12)' : 'rgba(255, 255, 255, 0.18)',
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
  },
  webGlass: {
    // react-native-web maps this to CSS backdrop-filter.
    backdropFilter: 'blur(18px)',
  } as object,
});
