import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Canvas,
  Rect,
  Shader,
  Skia,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/lib/theme';
import { palette } from '@/theme/tokens';

type Variant = 'velvet' | 'silk' | 'pearl';

type Props = {
  width: number;
  height: number;
  variant?: Variant;
  active?: boolean;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const velvetShader = Skia.RuntimeEffect.Make(`
uniform float2 uRes;
uniform float uTime;
uniform float3 uDeep;
uniform float3 uRose;
uniform float3 uGold;
uniform float uIntensity;

float hash21(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise21(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + float2(1.0, 0.0));
  float c = hash21(i + float2(0.0, 1.0));
  float d = hash21(i + float2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(float2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += noise21(p) * amp;
    p *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / uRes;
  float2 p = uv;
  p.x += sin(uv.y * 6.4 + uTime * 0.07) * 0.022;
  float foldA = sin(p.x * 9.0 + sin(p.y * 3.4 + uTime * 0.05) * 1.2 + uTime * 0.09);
  float foldB = sin(p.x * 17.0 - p.y * 1.4 + uTime * 0.05);
  float fold = smoothstep(-1.0, 1.0, foldA * 0.78 + foldB * 0.22);
  float n = fbm(p * float2(3.2, 4.8) + float2(uTime * 0.012, 0.0));

  float3 col = mix(uDeep, uRose, clamp(fold * 0.58 + n * 0.20, 0.0, 1.0));
  col = mix(col, uDeep * 1.12, smoothstep(0.6, 1.0, uv.y) * 0.26);

  float sheen = pow(
    smoothstep(0.58, 1.0, sin(uv.x * 2.6 + uv.y * 1.2 + uTime * 0.08) * 0.5 + 0.5),
    6.0
  );
  col += uGold * sheen * 0.17 * uIntensity;

  float edge = smoothstep(0.0, 0.16, uv.x) * smoothstep(1.0, 0.84, uv.x);
  col *= 0.94 + 0.06 * edge;
  col += (hash21(fragCoord) - 0.5) * 0.022;

  return half4(half3(col), 1.0);
}
`);

const silkShader = Skia.RuntimeEffect.Make(`
uniform float2 uRes;
uniform float uTime;
uniform float3 uDeep;
uniform float3 uRose;
uniform float3 uGold;
uniform float uIntensity;

float hash21(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / uRes;
  float2 p = uv;
  p.x += sin(uv.y * 4.0 + uTime * 0.10) * 0.06;
  p.y += sin(uv.x * 3.0 + uTime * 0.06) * 0.02;

  float band = sin((p.x * 1.15 + p.y * 0.55) * 13.0 + uTime * 0.18);
  float satin = smoothstep(-0.2, 1.0, band);
  float fine = sin((p.x * 0.7 - p.y * 1.4) * 31.0 + uTime * 0.12) * 0.5 + 0.5;

  float3 col = mix(uDeep, uRose, 0.18 + satin * 0.40);
  col += uGold * pow(fine, 14.0) * 0.12 * uIntensity;
  float glow = exp(-pow((uv.x - 0.68 - sin(uTime * 0.06) * 0.08) * 2.3, 2.0));
  col += uGold * glow * 0.10 * uIntensity;
  col += (hash21(fragCoord) - 0.5) * 0.016;
  return half4(half3(col), 1.0);
}
`);

const pearlShader = Skia.RuntimeEffect.Make(`
uniform float2 uRes;
uniform float uTime;
uniform float3 uDeep;
uniform float3 uRose;
uniform float3 uGold;
uniform float uIntensity;

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / uRes;
  float2 c = (uv - float2(0.5, 0.52)) * float2(uRes.x / uRes.y, 1.0);
  float d = length(c);
  float glow = exp(-d * d * 4.2);
  float halo = exp(-d * d * 12.0);
  float3 col = uDeep;
  col = mix(col, uRose, glow * 0.55);
  col += uGold * (halo * 0.22 + glow * 0.06) * uIntensity;
  float ring = smoothstep(0.43, 0.46, d) * smoothstep(0.49, 0.46, d);
  col += uGold * ring * 0.08;
  return half4(half3(col), 1.0);
}
`);

function rgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

const shaders = { velvet: velvetShader, silk: silkShader, pearl: pearlShader };

export function VelvetShader({
  width,
  height,
  variant = 'velvet',
  active = true,
  intensity = 1,
  style,
  children,
}: Props) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const clock = useClock();

  const uniforms = useMemo(() => {
    const deep = rgb(colors.stageDeep);
    const rose = rgb(variant === 'pearl' ? colors.stageMid : isDark ? palette.rose : palette.roseLight);
    const gold = rgb(palette.champagne);
    return { uDeep: deep, uRose: rose, uGold: gold };
  }, [colors.stageDeep, colors.stageMid, isDark, variant]);

  const animatedUniforms = useDerivedValue(() => {
    const time = active && !reducedMotion ? clock.value / 1000 : 0;
    return {
      uRes: vec(width, height),
      uTime: time,
      uDeep: uniforms.uDeep,
      uRose: uniforms.uRose,
      uGold: uniforms.uGold,
      uIntensity: intensity,
    };
  }, [width, height, active, reducedMotion, intensity, uniforms]);

  const shader = shaders[variant];

  return (
    <View style={[styles.wrap, style]}>
      {shader ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Rect x={0} y={0} width={width} height={height}>
            <Shader source={shader} uniforms={animatedUniforms} />
          </Rect>
        </Canvas>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.veil }]} />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
