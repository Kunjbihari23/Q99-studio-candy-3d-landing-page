/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, type ReactNode } from "react";

export interface ResponsiveScale {
  scale: number;
  positionY: number;
  zOffset: number;
}

export const useResponsiveScale = (): ResponsiveScale => {
  const [responsive, setResponsive] = useState<ResponsiveScale>({
    scale: 1,
    positionY: 0,
    zOffset: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      let scale = 1;
      let positionY = 0;
      let zOffset = 0;

      if (width <= 420) {
        // Mobile (Very Small)
        scale = 0.42;
        positionY = -0.2;
        zOffset = 2.0;
      } else if (width <= 768) {
        // Tablet / Mobile Landscape
        scale = 0.55;
        positionY = -0.12;
        zOffset = 1.4;
      } else if (width <= 1080) {
        // Standard Desktop
        scale = 0.7;
        positionY = -0.06;
        zOffset = 0.8;
      } else if (width <= 1200) {
        // Large Desktop
        scale = 0.82;
        positionY = 0;
        zOffset = 0.4;
      } else {
        // Extra Large
        scale = 0.9;
        positionY = 0;
        zOffset = 0;
      }

      setResponsive({ scale, positionY, zOffset });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return responsive;
};

/**
 * A helper component to wrap R3F content and apply responsive scaling/positioning
 */
export const ResponsiveGroup = ({ children }: { children: ReactNode }) => {
  const { scale, positionY, zOffset } = useResponsiveScale();
  return (
    <group scale={scale} position={[0, positionY, zOffset]} dispose={null}>
      {children}
    </group>
  );
};
