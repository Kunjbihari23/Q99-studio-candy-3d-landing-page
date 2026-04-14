// useResponsive.ts
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";

export function useResponsive() {
  const { size } = useThree();

  return useMemo(() => {
    const dpr = Math.min(window.devicePixelRatio, 2);

    const isMobile = size.width < 768;
    const isTablet = size.width < 1024;

    const zoomFix = dpr >= 1.5 ? 1.3 : 1;

    return {
      width: size.width,
      height: size.height,
      dpr,
      isMobile,
      isTablet,
      zoomFix,
    };
  }, [size]);
}
