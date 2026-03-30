import BubbleSystem from "./BubbleSystem";
import LiquidMesh from "./LiquidMesh";
import type { SodaDirection } from "./useSodaAnimation";

interface SodaSceneProps {
  progress: React.RefObject<{ value: number }>;
  color: string;
  bubbleCount: number;
  direction: SodaDirection;
}

/**
 * Composes liquid, bubbles, floating 3D candy models, and lighting
 * into a single Three.js scene group.
 */
const SodaScene = ({
  progress,
  color,
  bubbleCount,
  direction,
}: SodaSceneProps) => {
  return (
    <group>
      {/* Scene lighting for GLB models */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, 3, 2]} intensity={0.5} color="#ffccdd" />
      <pointLight position={[0, -2, 3]} intensity={0.8} color="#ff88aa" />

      <LiquidMesh progress={progress} color={color} direction={direction} />
      <BubbleSystem count={bubbleCount} color={color} progress={progress} />
    </group>
  );
};

export default SodaScene;
