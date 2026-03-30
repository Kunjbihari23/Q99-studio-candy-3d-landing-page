import { useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface UseGSAPTimelineOptions {
  /** If true, the timeline starts paused (default: true) */
  paused?: boolean;
  /** Timeline defaults passed to gsap.timeline() */
  defaults?: gsap.TweenVars;
}

interface UseGSAPTimelineReturn {
  timeline: React.RefObject<gsap.core.Timeline | null>;
  play: () => void;
  replay: () => void;
}

/**
 * Creates a GSAP timeline with automatic cleanup.
 * Returns a stable ref to the timeline plus play/replay helpers.
 */
export const useGSAPTimeline = (
  options: UseGSAPTimelineOptions = {},
): UseGSAPTimelineReturn => {
  const { paused = true, defaults } = options;
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    timelineRef.current = gsap.timeline({ paused, defaults });

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    timelineRef.current?.play();
  }, []);

  const replay = useCallback(() => {
    timelineRef.current?.restart();
  }, []);

  return { timeline: timelineRef, play, replay };
};
