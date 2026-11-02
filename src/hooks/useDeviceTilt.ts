import { DeviceMotion } from 'expo-sensors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { motion } from '@/theme/tokens';

type Tilt = {
  /** -1 (full start) to 1 (full end). */
  x: SharedValue<number>;
  /** -1 (up) to 1 (down). */
  y: SharedValue<number>;
  supported: boolean;
  requestPermission: () => void;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

/**
 * Device tilt is a garnish on top of drag, never the only way to move the
 * scene. Sensor permission is requested from a user gesture so iOS and mobile
 * web both accept it. Dragging still works when the sensor is unavailable.
 */
export function useDeviceTilt(enabled = true): Tilt {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const [supported, setSupported] = useState(false);
  const subscription = useRef<{ remove: () => void } | null>(null);
  const permissionAsked = useRef(false);

  const subscribe = useCallback(() => {
    if (subscription.current) return;
    let smoothX = 0;
    let smoothY = 0;
    subscription.current = DeviceMotion.addListener((measurement) => {
      const gy = measurement.rotation.gamma ?? 0;
      const gb = measurement.rotation.beta ?? 0;
      const targetX = clamp(gy / 28, -1, 1);
      // Beta sits near 90 when the phone is upright. Normalising around that
      // reading keeps the scene still while the phone is held naturally.
      const targetY = clamp((gb - 90) / 38, -1, 1);
      smoothX += (targetX - smoothX) * 0.14;
      smoothY += (targetY - smoothY) * 0.14;
      x.value = smoothX;
      y.value = smoothY;
    });
  }, [x, y]);

  const requestPermission = useCallback(() => {
    if (!enabled) return;
    if (!permissionAsked.current) {
      permissionAsked.current = true;
      DeviceMotion.requestPermissionsAsync()
        .then((permission) => {
          if (permission.granted) subscribe();
        })
        .catch(() => undefined);
    } else {
      subscribe();
    }
  }, [enabled, subscribe]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    DeviceMotion.isAvailableAsync()
      .then((available) => {
        if (cancelled) return;
        setSupported(available);
        if (!available) return;
        // Android and most browsers do not need an explicit permission grant.
        subscribe();
      })
      .catch(() => setSupported(false));

    return () => {
      cancelled = true;
      subscription.current?.remove();
      subscription.current = null;
      x.value = withSpring(0, motion.springSoft);
      y.value = withSpring(0, motion.springSoft);
    };
  }, [enabled, subscribe, x, y]);

  return useMemo(
    () => ({ x, y, supported, requestPermission }),
    [requestPermission, supported, x, y],
  );
}
