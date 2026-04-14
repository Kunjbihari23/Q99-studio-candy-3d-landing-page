import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import type { SodaDirection } from "./useSodaAnimation";
import liquidVertexShader from "./shaders/liquidVertex.glsl";
import liquidFragmentShader from "./shaders/liquidFragment.glsl";

interface LiquidMeshProps {
  progress: React.RefObject<{ value: number }>;
  color: string;
  direction: SodaDirection;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

/** Converts a hex color string to an RGB array [0-1]. */
const hexToRgb = (hex: string): [number, number, number] => {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  return [(num >> 16) / 255, ((num >> 8) & 0xff) / 255, (num & 0xff) / 255];
};

/**
 * Renders the liquid plane with custom shader material.
 * Position is driven by the progress ref (no React state in render loop).
 */
const LiquidMesh = ({
  progress,
  direction,
  width = 12,
  height = 8,
  aspectRatio,
}: LiquidMeshProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const primary = hexToRgb("#4DEAFE");
  const secondary = hexToRgb("#FE884D");
  const accent = hexToRgb("#FF50B0");

  // Calculate responsive width based on viewport aspect ratio
  const responsiveWidth = useMemo(() => {
    if (!aspectRatio) return width;
    // For wide screens (aspect > 2), increase width proportionally
    if (aspectRatio > 2.2) {
      return width * (aspectRatio / 1.4);
    } else if (aspectRatio > 1.8) {
      return width * 1.3;
    }
    return width;
  }, [width, aspectRatio]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveAmplitude: { value: 0.25 }, // Increased for more dynamic chaotic waves
      uWaveFrequency: { value: 1.5 },
      uProgress: { value: 0 },

      uPrimary: { value: primary },
      uSecondary: { value: secondary },
      uAccent: { value: accent },
      uOpacity: { value: 0.7 },
    }),
    [primary, secondary, accent],
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
    }

    if (meshRef.current) {
      const p = progress.current.value;
      const totalTravel = height - 3.8;

      // Dynamic overflow: liquid breathes up and down continuously once revealed
      // scales up as progress increases to avoid sudden jumps
      const overflow = p * Math.sin(time * 1.2) * 0.4;

      if (direction === "up") {
        meshRef.current.position.y =
          -height / 2 - 1 + p * totalTravel + overflow;
      } else {
        meshRef.current.position.y =
          height / 2 + 1 - p * totalTravel - overflow;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[responsiveWidth, height, 64, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={liquidVertexShader}
        fragmentShader={liquidFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

export default LiquidMesh;
