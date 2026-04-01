import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { ASSETS } from "../../../utils/assets";
import ParticleBurst from "../../../systems/ParticleBurst";
import { useSound } from "../../../systems/useSound";

const RAIN_COUNT = 20;
const CANDY_TYPES = [
  ASSETS.glb.candyPink,
  ASSETS.glb.candyGreen,
  ASSETS.glb.candyMix,
];
const RAIN_PER_TYPE = Math.ceil(RAIN_COUNT / CANDY_TYPES.length);
const FALL_AREA = {
  width: 12,
  height: 16,
  depth: 5,
};
const REPEL_RADIUS = 1.9;
const REPEL_FORCE = 7.8;

interface RainState {
  positions: Float32Array;
  velocities: Float32Array;
  rotations: Float32Array;
  rotationSpeeds: Float32Array;
  scales: Float32Array;
}

interface BurstState {
  id: number;
  position: [number, number, number];
}

let rainBurstId = 0;

const createRainState = (count: number): RainState => {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const rotations = new Float32Array(count * 3);
  const rotationSpeeds = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    positions[stride] = THREE.MathUtils.randFloatSpread(FALL_AREA.width);
    positions[stride + 1] = THREE.MathUtils.randFloat(
      -FALL_AREA.height * 0.5,
      FALL_AREA.height * 0.65,
    );
    positions[stride + 2] = THREE.MathUtils.randFloatSpread(FALL_AREA.depth);

    velocities[stride] = THREE.MathUtils.randFloatSpread(0.18);
    velocities[stride + 1] = THREE.MathUtils.randFloat(0.3, 1);
    velocities[stride + 2] = THREE.MathUtils.randFloatSpread(0.16);

    rotations[stride] = Math.random() * Math.PI * 2;
    rotations[stride + 1] = Math.random() * Math.PI * 2;
    rotations[stride + 2] = Math.random() * Math.PI * 2;

    rotationSpeeds[stride] = THREE.MathUtils.randFloat(0.4, 1.2);
    rotationSpeeds[stride + 1] = THREE.MathUtils.randFloat(0.5, 1.6);
    rotationSpeeds[stride + 2] = THREE.MathUtils.randFloat(0.4, 1.2);
    scales[index] = THREE.MathUtils.randFloat(0.18, 0.42);
  }

  return { positions, velocities, rotations, rotationSpeeds, scales };
};

const respawnInstance = (state: RainState, index: number) => {
  const stride = index * 3;
  state.positions[stride] = THREE.MathUtils.randFloatSpread(FALL_AREA.width);
  state.positions[stride + 1] = THREE.MathUtils.randFloat(
    FALL_AREA.height * 0.45,
    FALL_AREA.height * 0.8,
  );
  state.positions[stride + 2] = THREE.MathUtils.randFloatSpread(
    FALL_AREA.depth,
  );
  state.velocities[stride] = THREE.MathUtils.randFloatSpread(0.18);
  state.velocities[stride + 1] = THREE.MathUtils.randFloat(0.6, 1.2);
  state.velocities[stride + 2] = THREE.MathUtils.randFloatSpread(0.16);
  state.rotations[stride] = Math.random() * Math.PI * 2;
  state.rotations[stride + 1] = Math.random() * Math.PI * 2;
  state.rotations[stride + 2] = Math.random() * Math.PI * 2;
};

const PointerPlaneTracker = ({
  targetRef,
}: {
  targetRef: React.MutableRefObject<THREE.Vector3>;
}) => {
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const hitPointRef = useRef(new THREE.Vector3());

  useFrame(({ camera, pointer, raycaster }) => {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(planeRef.current, hitPointRef.current)) {
      targetRef.current.copy(hitPointRef.current);
    }
  });

  return null;
};

const CandyRainField = ({
  isActive,
  candyPath,
  typeIndex,
}: {
  isActive: boolean;
  candyPath: string;
  typeIndex: number;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const rainStateRef = useRef<RainState>(createRainState(RAIN_PER_TYPE));
  const mouseWorldRef = useRef(new THREE.Vector3(99, 99, 0));
  const [bursts, setBursts] = useState<BurstState[]>([]);
  const { invalidate } = useThree();
  const { playPop } = useSound();

  const { scene } = useGLTF(candyPath);

  const { geometry, material } = useMemo<{
    geometry: THREE.BufferGeometry | null;
    material: THREE.Material | THREE.Material[] | null;
  }>(() => {
    let geo: THREE.BufferGeometry | null = null;
    let mat: THREE.Material | THREE.Material[] | null = null;
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        if (!geo) geo = mesh.geometry.clone();
        if (!mat) mat = mesh.material;
      }
    });
    return { geometry: geo, material: mat };
  }, [scene]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    for (let index = 0; index < RAIN_PER_TYPE; index += 1) {
      const hue =
        (0.52 + ((index + typeIndex * RAIN_PER_TYPE) % 6) / 6) * 0.36 +
        typeIndex * 0.15;
      color.setHSL(hue % 1, 0.82, 0.66);
      mesh.setColorAt(index, color);
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [color, typeIndex]);

  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    if (!isActive) return;

    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const rainState = rainStateRef.current;
    const mouseX = mouseWorldRef.current.x;
    const mouseY = mouseWorldRef.current.y;

    for (let index = 0; index < RAIN_PER_TYPE; index += 1) {
      const stride = index * 3;
      let x = rainState.positions[stride];
      let y = rainState.positions[stride + 1];
      let z = rainState.positions[stride + 2];

      x += rainState.velocities[stride] * delta;
      y -= rainState.velocities[stride + 1] * delta;
      z += rainState.velocities[stride + 2] * delta;

      const dx = x - mouseX;
      const dy = y - mouseY;
      const distSq = dx * dx + dy * dy;
      if (distSq < REPEL_RADIUS * REPEL_RADIUS) {
        const dist = Math.max(0.08, Math.sqrt(distSq));
        const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE * delta;
        x += (dx / dist) * force;
        y += (dy / dist) * force;
      }

      if (y < -FALL_AREA.height * 0.6) {
        respawnInstance(rainState, index);
        x = rainState.positions[stride];
        y = rainState.positions[stride + 1];
        z = rainState.positions[stride + 2];
      } else {
        rainState.positions[stride] = x;
        rainState.positions[stride + 1] = y;
        rainState.positions[stride + 2] = z;
      }

      rainState.rotations[stride] += rainState.rotationSpeeds[stride] * delta;
      rainState.rotations[stride + 1] +=
        rainState.rotationSpeeds[stride + 1] * delta;
      rainState.rotations[stride + 2] +=
        rainState.rotationSpeeds[stride + 2] * delta;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        rainState.rotations[stride],
        rainState.rotations[stride + 1],
        rainState.rotations[stride + 2],
      );
      dummy.scale.setScalar(rainState.scales[index]);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    invalidate();
  });

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();

      if (typeof event.instanceId !== "number") {
        return;
      }

      const index = event.instanceId;
      const rainState = rainStateRef.current;
      const stride = index * 3;
      const position: [number, number, number] = [
        rainState.positions[stride],
        rainState.positions[stride + 1],
        rainState.positions[stride + 2],
      ];

      rainBurstId += 1;
      const nextBurst = { id: rainBurstId, position };
      setBursts((current) => [...current, nextBurst]);
      window.setTimeout(() => {
        setBursts((current) =>
          current.filter((burst) => burst.id !== nextBurst.id),
        );
      }, 1000);

      respawnInstance(rainState, index);
      playPop();
    },
    [playPop],
  );

  return (
    <>
      <PointerPlaneTracker targetRef={mouseWorldRef} />
      <instancedMesh
        ref={meshRef}
        args={[
          geometry as THREE.BufferGeometry | undefined,
          material as THREE.Material | undefined,
          RAIN_PER_TYPE,
        ]}
        onPointerDown={handlePointerDown}
        castShadow
        receiveShadow
        frustumCulled={false}
      />

      {bursts.map((burst) => (
        <ParticleBurst
          key={burst.id}
          position={burst.position}
          color="#ffe2a0"
          count={34}
        />
      ))}
    </>
  );
};

const LeaderboardWorld = ({ activeIndex }: { activeIndex: number }) => {
  // Only activate falling rain when nearly reaching the bottom section (Index 4)
  const isRainActive = activeIndex > 3.65;

  return (
    <group>
      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 8, 6]} intensity={1.35} color="#ffffff" />
      <pointLight
        position={[-4, 1, 5]}
        intensity={12}
        distance={16}
        color="#7be8ff"
      />
      <pointLight
        position={[4, 1, 5]}
        intensity={10}
        distance={16}
        color="#ff69c8"
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial
          color="#13061b"
          roughness={0.92}
          metalness={0.06}
        />
      </mesh>

      {CANDY_TYPES.map((candyPath, index) => (
        <CandyRainField
          key={candyPath}
          isActive={isRainActive}
          candyPath={candyPath}
          typeIndex={index}
        />
      ))}
    </group>
  );
};

export default LeaderboardWorld;
