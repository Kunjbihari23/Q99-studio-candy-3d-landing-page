import { useRef, useEffect, useCallback } from "react";

interface RevealContainerProps {
  progress: React.RefObject<{ value: number }>;
  children: React.ReactNode;
  /** Progress threshold at which UI starts appearing (0-1) */
  revealStart?: number;
  className?: string;
}

/**
 * HTML overlay that reveals children based on animation progress.
 * Uses requestAnimationFrame to read the progress ref and apply CSS transforms.
 * Fully decoupled from Three.js logic.
 */
const RevealContainer = ({
  progress,
  children,
  revealStart = 0.3,
  className = "",
}: RevealContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  const animate = useCallback(() => {
    if (!containerRef.current) return;

    const loop = () => {
      const p = progress.current.value;

      const revealProgress = Math.max(
        0,
        Math.min(1, (p - revealStart) / (1 - revealStart)),
      );

      const opacity = revealProgress;
      const translateY = (1 - revealProgress) * 40;
      const scale = 0.95 + revealProgress * 0.05;

      containerRef.current!.style.opacity = String(opacity);
      containerRef.current!.style.transform = `translateY(${translateY}px) scale(${scale})`;

      rafId.current = requestAnimationFrame(loop);
    };

    loop();
  }, [progress, revealStart]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      // Skip animation, show immediately
      if (containerRef.current) {
        containerRef.current.style.opacity = "1";
        containerRef.current.style.transform = "translateY(0) scale(1)";
      }
      return;
    }

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [animate]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(40px) scale(0.95)",
        willChange: "transform, opacity",
        transition: "none",
      }}
    >
      {children}
    </div>
  );
};

export default RevealContainer;
