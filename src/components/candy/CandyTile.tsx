import { Clone, useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { memo, useEffect, useRef } from "react";
import * as THREE from "three";
import { useMicroMotion } from "../../systems/useMicroMotion";
import { ASSETS } from "../../utils/assets";

export type CandyType = "berry" | "mint" | "lemon" | "grape" | "soda" | "peach";

export interface CandyTileData {
  id: number;
  type: CandyType;
  row: number;
  col: number;
  removing: boolean;
}

const MODEL_PATH_BY_TYPE: Record<CandyType, string> = {
  berry: ASSETS.glb.candyPink,
  mint: ASSETS.glb.candyGreen,
  lemon: ASSETS.glb.candyColorFull,
  grape: ASSETS.glb.candyMix,
  soda: ASSETS.glb.candyStick,
  peach: ASSETS.glb.candyRed,
};

Object.values(MODEL_PATH_BY_TYPE).forEach((path) => {
  useGLTF.preload(path);
});

interface CandyTileProps {
  tile: CandyTileData;
  position: readonly [number, number, number];
  selected?: boolean;
  disabled?: boolean;
  isActive?: boolean;
  onPointerDown?: (
    tile: CandyTileData,
    event: ThreeEvent<PointerEvent>,
  ) => void;
}

const setCursor = (value: string) => {
  if (typeof document !== "undefined") {
    document.body.style.cursor = value;
  }
};

const CandyTile = memo(
  ({
    tile,
    position,
    selected = false,
    disabled = false,
    isActive = true,
    onPointerDown,
  }: CandyTileProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const microMotion = useMicroMotion({
      floatAmplitude: 0.05,
      floatSpeed: 1.7,
      hoverScale: 1.08,
      bounceStrength: 0.06,
      baseGlow: 0.08,
      hoverGlow: 0.18,
    });
    const { scene } = useGLTF(MODEL_PATH_BY_TYPE[tile.type]);

    useEffect(() => {
      return () => setCursor("");
    }, []);

    useFrame(({ clock }, delta) => {
      // Gate the animation loop if the section is not active
      if (!isActive) return;

      const group = groupRef.current;

      if (!group) {
        return;
      }

      const motion = microMotion.sample(clock.getElapsedTime(), delta);
      const targetY = position[1] + motion.floatOffset;
      const startY = position[1] + 3;
      const initialGroup = !group.userData.initialized;

      if (initialGroup) {
        group.userData.initialized = true;
        group.position.y = startY;
      }

      group.position.x = THREE.MathUtils.damp(
        group.position.x,
        position[0],
        12,
        delta,
      );
      group.position.y = THREE.MathUtils.damp(
        group.position.y,
        targetY,
        initialGroup ? 8 : 12,
        delta,
      );
      group.position.z = THREE.MathUtils.damp(
        group.position.z,
        position[2],
        12,
        delta,
      );

      const targetScale = tile.removing ? 0.01 : selected ? 1.12 : 1;
      const burstScale = tile.removing ? 1.28 : targetScale;
      const nextScale = burstScale * motion.scale;
      group.scale.x = THREE.MathUtils.damp(group.scale.x, nextScale, 14, delta);
      group.scale.y = THREE.MathUtils.damp(group.scale.y, nextScale, 14, delta);
      group.scale.z = THREE.MathUtils.damp(group.scale.z, nextScale, 14, delta);
    });

    const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
      if (disabled) {
        return;
      }

      event.stopPropagation();
      microMotion.triggerBounce();
      onPointerDown?.(tile, event);
    };

    return (
      <group ref={groupRef} position={position}>
        <group
          onPointerOver={(event) => {
            microMotion.handlePointerOver(event);
            if (!disabled) {
              setCursor("pointer");
            }
          }}
          onPointerOut={(event) => {
            microMotion.handlePointerOut(event);
            setCursor("");
          }}
          onPointerDown={handlePointerDown}
        >
          <Clone object={scene} scale={0.9} rotation={[0, Math.PI / 0.29, 0]} />
        </group>
      </group>
    );
  },
  (prev, next) => {
    return (
      prev.isActive === next.isActive &&
      prev.tile.id === next.tile.id &&
      prev.tile.type === next.tile.type &&
      prev.tile.row === next.tile.row &&
      prev.tile.col === next.tile.col &&
      prev.tile.removing === next.tile.removing &&
      prev.selected === next.selected &&
      prev.disabled === next.disabled &&
      prev.position[0] === next.position[0] &&
      prev.position[1] === next.position[1] &&
      prev.position[2] === next.position[2]
    );
  },
);

CandyTile.displayName = "CandyTile";

export default CandyTile;
