import { memo, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, Clone } from "@react-three/drei";
import { useMicroMotion } from "../../systems/useMicroMotion";

useGLTF.preload("/Glb-Models/candy_pink.glb");
useGLTF.preload("/Glb-Models/candy_model_green.glb");
useGLTF.preload("/Glb-Models/Color_Full_Candy.glb");
useGLTF.preload("/Glb-Models/Mix_candy.glb");
useGLTF.preload("/Glb-Models/candy_stick.glb");
useGLTF.preload("/Glb-Models/red_candy_monster.glb");

export type CandyType = "berry" | "mint" | "lemon" | "grape" | "soda" | "peach";

export interface CandyTileData {
  id: number;
  type: CandyType;
  row: number;
  col: number;
  removing: boolean;
}

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
    const shellRef = useRef<THREE.Group>(null);
    const microMotion = useMicroMotion({
      floatAmplitude: 0.05,
      floatSpeed: 1.7,
      hoverScale: 1.08,
      bounceStrength: 0.06,
      baseGlow: 0.08,
      hoverGlow: 0.18,
    });

    const { scene: berryScene } = useGLTF("/Glb-Models/candy_pink.glb");
    const { scene: mintScene } = useGLTF("/Glb-Models/candy_model_green.glb");
    const { scene: lemonScene } = useGLTF("/Glb-Models/Color_Full_Candy.glb");
    const { scene: grapeScene } = useGLTF("/Glb-Models/Mix_candy.glb");
    const { scene: sodaScene } = useGLTF("/Glb-Models/candy_stick.glb");
    const { scene: peachScene } = useGLTF("/Glb-Models/red_candy_monster.glb");

    const scene = useMemo(() => {
      switch (tile.type) {
        case "berry":
          return berryScene;
        case "mint":
          return mintScene;
        case "lemon":
          return lemonScene;
        case "grape":
          return grapeScene;
        case "soda":
          return sodaScene;
        case "peach":
          return peachScene;
        default:
          return berryScene;
      }
    }, [
      tile.type,
      berryScene,
      mintScene,
      lemonScene,
      grapeScene,
      sodaScene,
      peachScene,
    ]);

    useFrame((_, delta) => {
      // Gate the animation loop if the section is not active
      if (!isActive) return;

      const group = groupRef.current;
      const shell = shellRef.current;

      if (!group || !shell) {
        return;
      }

      const motion = microMotion.sample(performance.now() * 0.001, delta);
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

      shell.rotation.y += delta * 0.45;
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
          ref={shellRef}
          onPointerOver={microMotion.handlePointerOver}
          onPointerOut={microMotion.handlePointerOut}
          onPointerDown={handlePointerDown}
        >
          <Clone object={scene} scale={0.9} />
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
