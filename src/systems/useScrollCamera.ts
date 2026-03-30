import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export interface CameraPose {
  position: [number, number, number];
  rotation: [number, number, number];
}

interface ScrollCameraOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  poses: readonly CameraPose[];
}

export const useScrollCamera = ({
  containerRef,
  poses,
}: ScrollCameraOptions) => {
  const targetRef = useRef({
    position: new THREE.Vector3(...poses[0].position),
    rotation: new THREE.Euler(...poses[0].rotation),
  });
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  useGSAP(
    () => {
      if (!containerRef.current) {
        return;
      }

      const target = targetRef.current;
      target.position.set(...poses[0].position);
      target.rotation.set(...poses[0].rotation);

      /*
       * Timeline based on a 5-section linear scroll flow:
       *   0.00 – 0.20  → index 0 (Hero)
       *   0.20 – 0.40  → index 1 (About / Candy Lab)
       *   0.40 – 0.60  → index 2 (Levels / Match3)
       *   0.60 – 0.80  → index 3 (Graphics / Powerup)
       *   0.80 – 1.00  → index 4 (Gameplay / Leaderboard)
       */
      const SCENE_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8];

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress;
            let nextIndex = 0;
            for (let i = SCENE_THRESHOLDS.length - 1; i >= 0; i--) {
              if (p >= SCENE_THRESHOLDS[i]) {
                nextIndex = i;
                break;
              }
            }
            setActiveSceneIndex((current) =>
              current === nextIndex ? current : nextIndex,
            );
          },
        },
      });

      poses.slice(1).forEach((pose, index) => {
        const duration = 1;
        const offset = index;
        timeline.to(
          target.position,
          {
            x: pose.position[0],
            y: pose.position[1],
            z: pose.position[2],
            duration,
          },
          offset,
        );
        timeline.to(
          target.rotation,
          {
            x: pose.rotation[0],
            y: pose.rotation[1],
            z: pose.rotation[2],
            duration,
          },
          offset,
        );
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
    { dependencies: [containerRef, poses] },
  );

  return {
    activeSceneIndex,
    targetRef,
  };
};
