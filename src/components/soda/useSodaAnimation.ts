import { useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type SodaDirection = "up" | "down";

interface UseSodaAnimationOptions {
  duration: number;
  direction: SodaDirection;
  onComplete?: () => void;
}

interface UseSodaAnimationReturn {
  /** Current animation progress (0–1), updated by GSAP */
  progress: React.RefObject<{ value: number }>;
  /** Start animation from current position */
  play: () => void;
  /** Restart animation from the beginning */
  replay: () => void;
}

/**
 * Controls the soda fill animation via a GSAP timeline.
 * Progress is stored in a mutable ref to avoid React re-renders in the render loop.
 */
export const useSodaAnimation = (
  options: UseSodaAnimationOptions,
): UseSodaAnimationReturn => {
  const { duration, onComplete } = options;
  const progress = useRef({ value: 0 });
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      paused: true,
      onComplete,
    });

    tl.to(progress.current, {
      value: 1,
      duration,
      ease: "power2.inOut",
    });

    timelineRef.current = tl;

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [duration, onComplete]);

  const play = useCallback(() => {
    timelineRef.current?.play();
  }, []);

  const replay = useCallback(() => {
    progress.current.value = 0;
    timelineRef.current?.restart();
  }, []);

  return { progress, play, replay };
};
