import { useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useSodaAnimation, type SodaDirection } from "./useSodaAnimation";
import SodaScene from "./SodaScene";
import RevealContainer from "../reveal/RevealContainer";

interface SodaRevealProps {
  /** Primary liquid/bubble color (hex string) */
  color?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Number of bubble instances */
  bubbleCount?: number;
  /** Direction of liquid fill */
  direction?: SodaDirection;
  /** Auto-play animation on mount */
  autoPlay?: boolean;
  /** Additional CSS class for the container */
  className?: string;
  /** Progress threshold at which UI starts revealing (0-1) */
  revealStart?: number;
  /** Content to reveal */
  children: React.ReactNode;
}

export interface SodaRevealHandle {
  play: () => void;
  replay: () => void;
}

/**
 * Public API component for the Soda Reveal animation.
 *
 * Usage:
 * ```tsx
 * <SodaReveal color="#ff4d6d" duration={2} bubbleCount={80} direction="up">
 *   <YourContent />
 * </SodaReveal>
 * ```
 */
const SodaReveal = forwardRef<SodaRevealHandle, SodaRevealProps>(
  (
    {
      color = "#60F1FE",
      duration = 2,
      bubbleCount = 80,
      direction = "up",
      autoPlay = true,
      className = "",
      revealStart = 0.3,
      children,
    },
    ref,
  ) => {
    const { progress, play, replay } = useSodaAnimation({
      duration,
      direction,
    });

    useImperativeHandle(ref, () => ({ play, replay }), [play, replay]);

    useEffect(() => {
      if (autoPlay) {
        // Small delay to let the canvas mount and render first frame
        const timer = setTimeout(play, 100);
        return () => clearTimeout(timer);
      }
    }, [autoPlay, play]);

    const handleReplay = useCallback(() => {
      replay();
    }, [replay]);

    return (
      <div
        className={`soda-reveal-root ${className}`}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Three.js Canvas — fills the container */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Canvas
            dpr={[0.75, 1]}
            camera={{ position: [0, 0, 6], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: "transparent" }}
          >
            <SodaScene
              progress={progress}
              color={color}
              bubbleCount={bubbleCount}
              direction={direction}
            />
          </Canvas>
        </div>

        {/* Revealed UI content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <RevealContainer progress={progress} revealStart={revealStart}>
            {children}
          </RevealContainer>
        </div>

        {/* Hidden replay trigger for programmatic control */}
        <button
          onClick={handleReplay}
          aria-label="Replay soda animation"
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 2,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            color: "white",
            fontSize: 18,
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          }}
        >
          ↻
        </button>
      </div>
    );
  },
);

SodaReveal.displayName = "SodaReveal";

export default SodaReveal;
