import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type FrameRateSample = {
  fps: number;
  min: number;
  average: number;
  samples: number;
};

const EMPTY: FrameRateSample = { fps: 0, min: 0, average: 0, samples: 0 };

/**
 * Measures requestAnimationFrame cadence on the JS thread. This is a useful
 * regression signal for the web fallback and the UI layer, but it is not a
 * substitute for GPU frame timings on a real Android device. The motion lab
 * labels it accordingly.
 */
export function useFrameRate(active: boolean, windowMs = 2800) {
  const [sample, setSample] = useState<FrameRateSample>(EMPTY);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    let last = 0;
    let deltas: number[] = [];
    let lastPublish = 0;
    let mounted = true;

    const tick = (time: number) => {
      if (!mounted) return;
      if (last > 0) {
        const delta = time - last;
        if (delta > 0 && delta < 250) {
          deltas.push(delta);
          const maxFrames = Math.ceil(windowMs / 16) + 30;
          if (deltas.length > maxFrames) deltas = deltas.slice(-maxFrames);
        }
      }
      last = time;

      if (time - lastPublish > 480 && deltas.length > 4) {
        lastPublish = time;
        const averageDelta = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
        const maxDelta = Math.max(...deltas);
        if (mounted) {
          setSample({
            fps: Math.round(1000 / averageDelta),
            min: Math.round(1000 / maxDelta),
            average: Math.round(1000 / averageDelta),
            samples: deltas.length,
          });
        }
      }

      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [active, windowMs]);

  return { ...(active ? sample : EMPTY), platform: Platform.OS };
}
