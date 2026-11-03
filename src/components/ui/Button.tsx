import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hapticPress } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import { motion, palette, radii } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'veil' | 'gold' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

const heights = { sm: 40, md: 50, lg: 56 } as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variants = {
    primary: {
      background: colors.primary,
      border: 'rgba(201, 154, 134, 0.55)',
      text: colors.onPrimary,
      icon: colors.onPrimary,
    },
    dark: {
      background: colors.text,
      border: colors.goldLine,
      text: colors.bg,
      icon: colors.bg,
    },
    outline: {
      background: 'transparent',
      border: colors.goldLine,
      text: colors.text,
      icon: colors.accentText,
    },
    ghost: {
      background: 'transparent',
      border: 'transparent',
      text: colors.textSecondary,
      icon: colors.textSecondary,
    },
    veil: {
      background: 'rgba(255, 251, 250, 0.10)',
      border: 'rgba(201, 154, 134, 0.62)',
      text: colors.onVeil,
      icon: colors.onVeil,
    },
    gold: {
      background: colors.accent,
      border: 'rgba(255, 255, 255, 0.28)',
      text: palette.aubergine,
      icon: palette.aubergine,
    },
  }[variant];

  const isDisabled = disabled || loading;
  const textColor = isDisabled ? colors.textTertiary : variants.text;

  return (
    <Animated.View style={[animatedStyle, fullWidth ? styles.fullWidth : null, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        testID={testID}
        disabled={isDisabled}
        onPress={() => {
          if (isDisabled) return;
          hapticPress();
          onPress?.();
        }}
        onPressIn={() => {
          if (isDisabled || reducedMotion) return;
          // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design.
          scale.value = withSpring(0.975, motion.spring);
        }}
        onPressOut={() => {
          if (isDisabled || reducedMotion) return;
          // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design.
          scale.value = withSpring(1, motion.spring);
        }}
        style={({ pressed }) => [
          styles.base,
          {
            height: heights[size],
            backgroundColor: variants.background,
            borderColor: variants.border,
            opacity: isDisabled ? 0.55 : pressed ? 0.92 : 1,
            paddingHorizontal: size === 'sm' ? 18 : 24,
          },
        ]}>
        <View style={styles.inner}>
          {loading ? (
            <ActivityIndicator size="small" color={variants.icon} />
          ) : icon && iconPosition === 'start' ? (
            <Icon name={icon} size={17} color={isDisabled ? colors.textTertiary : variants.icon} />
          ) : null}
          <AppText
            variant="button"
            style={[styles.label, { color: textColor, letterSpacing: 0.4 }]}
            maxScale={1.3}>
            {label}
          </AppText>
          {!loading && icon && iconPosition === 'end' ? (
            <Icon name={icon} size={17} color={isDisabled ? colors.textTertiary : variants.icon} />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  base: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 4,
  },
  label: {
    textAlign: 'center',
  },
});
