import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { randomRange } from "../../utils/random";

interface BubbleSystemProps {
  count: number;
  color: string;
  progress: React.RefObject<{ value: number }>;
  bounds?: { x: number; y: number; z: number };
}

interface BubbleData {
  offsets: Float32Array;
  speeds: Float32Array;
  scales: Float32Array;
  phases: Float32Array;
}

/**
 * Initialize random bubble data — positions, speeds, scales, and phase offsets.
 */
const createBubbleData = (
  count: number,
  bounds: { x: number; y: number; z: number },
): BubbleData => {
  const offsets = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    offsets[i * 3] = randomRange(-bounds.x, bounds.x);
    offsets[i * 3 + 1] = randomRange(-bounds.y, bounds.y);
    offsets[i * 3 + 2] = randomRange(-bounds.z * 0.5, bounds.z * 0.5);
    speeds[i] = randomRange(0.5, 2.0);
    scales[i] = randomRange(0.02, 0.08);
    phases[i] = randomRange(0, Math.PI * 2);
  }

  return { offsets, speeds, scales, phases };
};

/**
 * InstancedMesh-based bubble particle system.
 * Uses additive blending for a glow effect.
 * Updates all transforms in useFrame without React state.
 */
const BubbleSystem = ({
  count,
  color,
  progress,
  bounds = { x: 4, y: 5, z: 2 },
}: BubbleSystemProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const bubbleData = useMemo(
    () => createBubbleData(count, bounds),
    [count, bounds],
  );

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(1.5),
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color],
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const p = progress.current.value;
    // Only show bubbles when animation has started
    if (p <= 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const time = clock.getElapsedTime();
    const { offsets, speeds, scales, phases } = bubbleData;

    for (let i = 0; i < count; i++) {
      const baseX = offsets[i * 3];
      const baseY = offsets[i * 3 + 1];
      const baseZ = offsets[i * 3 + 2];
      const speed = speeds[i];
      const scale = scales[i * 2];
      const phase = phases[i];

      // Continuous upward motion with looping
      const y = ((baseY + time * speed + phase) % (bounds.y * 2)) - bounds.y;

      const currentScale = scale * (0.5 + p * 1);

      // Slight horizontal wobble
      const wobbleX = Math.sin(time * 1.5 + phase) * 0.15;
      const wobbleZ = Math.cos(time * 1.2 + phase * 0.7) * 0.1;

      dummy.position.set(baseX + wobbleX, y, baseZ + wobbleZ);
      dummy.scale.setScalar(currentScale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
};

export default BubbleSystem;
