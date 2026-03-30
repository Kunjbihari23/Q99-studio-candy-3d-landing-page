/* eslint-disable react-hooks/purity */
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

interface UseMicroMotionOptions {
  floatAmplitude?: number;
  floatSpeed?: number;
  hoverScale?: number;
  bounceStrength?: number;
  bounceDamping?: number;
  baseGlow?: number;
  hoverGlow?: number;
}

interface MicroMotionSample {
  floatOffset: number;
  scale: number;
  glow: number;
  hoverMix: number;
}

const defaultOptions: Required<UseMicroMotionOptions> = {
  floatAmplitude: 0.08,
  floatSpeed: 1.2,
  hoverScale: 1.08,
  bounceStrength: 0.12,
  bounceDamping: 9,
  baseGlow: 0.12,
  hoverGlow: 0.22,
};

export const useMicroMotion = (options: UseMicroMotionOptions = {}) => {
  const config = useMemo(() => ({ ...defaultOptions, ...options }), [options]);

  const hoveredRef = useRef(false);
  const bounceRef = useRef(0);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  const setHovered = useCallback((value: boolean) => {
    hoveredRef.current = value;
  }, []);

  const triggerBounce = useCallback((strength = 1) => {
    bounceRef.current = Math.max(bounceRef.current, strength);
  }, []);

  const handlePointerOver = useCallback(
    (event?: { stopPropagation?: () => void }) => {
      event?.stopPropagation?.();
      hoveredRef.current = true;
    },
    [],
  );

  const handlePointerOut = useCallback(
    (event?: { stopPropagation?: () => void }) => {
      event?.stopPropagation?.();
      hoveredRef.current = false;
    },
    [],
  );

  const sample = useCallback(
    (time: number, delta: number): MicroMotionSample => {
      bounceRef.current = THREE.MathUtils.damp(
        bounceRef.current,
        0,
        config.bounceDamping,
        delta,
      );

      const hoverMix = hoveredRef.current ? 1 : 0;
      const bounce =
        Math.sin((1 - bounceRef.current) * Math.PI * 2.6) *
        bounceRef.current *
        config.bounceStrength;

      return {
        floatOffset:
          Math.sin(time * config.floatSpeed + phaseRef.current) *
          config.floatAmplitude,
        scale: 1 + hoverMix * (config.hoverScale - 1) + Math.max(0, bounce),
        glow:
          config.baseGlow +
          hoverMix * config.hoverGlow +
          Math.max(0, bounce) * config.hoverGlow,
        hoverMix,
      };
    },
    [config],
  );

  return {
    setHovered,
    triggerBounce,
    handlePointerOver,
    handlePointerOut,
    sample,
  };
};
