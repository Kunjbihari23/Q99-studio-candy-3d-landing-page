/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleBurstProps {
  position?: readonly [number, number, number];
  color?: THREE.ColorRepresentation;
  count?: number;
}

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
  ages: Float32Array;
  lifetimes: Float32Array;
}

const GRAVITY = -3.8;
const DRAG = 1.8;
const MIN_LIFETIME = 0.45;
const MAX_LIFETIME = 0.9;

const createParticleData = (count: number): ParticleData => ({
  positions: new Float32Array(count * 3),
  velocities: new Float32Array(count * 3),
  ages: new Float32Array(count),
  lifetimes: new Float32Array(count),
});

const resetParticleData = (data: ParticleData, count: number) => {
  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const azimuth = Math.random() * Math.PI * 2;
    const elevation = Math.random() * Math.PI;
    const speed = THREE.MathUtils.randFloat(1.2, 4.2);
    const spread = THREE.MathUtils.randFloat(0.5, 1.1);

    data.positions[stride] = 0;
    data.positions[stride + 1] = 0;
    data.positions[stride + 2] = 0;

    data.velocities[stride] =
      Math.cos(azimuth) * Math.sin(elevation) * speed * spread;
    data.velocities[stride + 1] =
      Math.cos(elevation) * speed + THREE.MathUtils.randFloat(0.6, 1.8);
    data.velocities[stride + 2] =
      Math.sin(azimuth) * Math.sin(elevation) * speed * spread;

    data.ages[index] = 0;
    data.lifetimes[index] = THREE.MathUtils.randFloat(
      MIN_LIFETIME,
      MAX_LIFETIME,
    );
  }
};

const ParticleBurst = ({
  position = [0, 0, 0],
  color = "#ffffff",
  count = 24,
}: ParticleBurstProps) => {
  const particleCount = Math.max(1, Math.floor(count));
  const [x, y, z] = position;

  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const positionAttributeRef = useRef<THREE.BufferAttribute>(null);

  const particleData = useMemo(
    () => createParticleData(particleCount),
    [particleCount],
  );

  useEffect(() => {
    const points = pointsRef.current;
    const material = materialRef.current;
    const positionAttribute = positionAttributeRef.current;

    if (!points || !material || !positionAttribute) {
      return;
    }

    resetParticleData(particleData, particleCount);

    points.visible = true;
    points.position.set(x, y, z);

    material.color.set(color);
    material.opacity = 1;

    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    positionAttribute.needsUpdate = true;
  }, [color, particleCount, particleData, x, y, z]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    const material = materialRef.current;
    const positionAttribute = positionAttributeRef.current;

    if (!points || !material || !positionAttribute || !points.visible) {
      return;
    }

    let aliveCount = 0;
    let maxOpacity = 0;

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      const age = particleData.ages[index] + delta;
      const lifetime = particleData.lifetimes[index];
      const progress = age / lifetime;

      particleData.ages[index] = age;

      if (progress >= 1) {
        particleData.positions[stride] = 0;
        particleData.positions[stride + 1] = -999;
        particleData.positions[stride + 2] = 0;
        continue;
      }

      aliveCount += 1;
      maxOpacity = Math.max(maxOpacity, 1 - progress);

      const damping = Math.exp(-DRAG * age);
      particleData.positions[stride] =
        particleData.velocities[stride] * age * damping;
      particleData.positions[stride + 1] =
        particleData.velocities[stride + 1] * age * damping +
        0.5 * GRAVITY * age * age;
      particleData.positions[stride + 2] =
        particleData.velocities[stride + 2] * age * damping;
    }

    material.opacity = maxOpacity;
    positionAttribute.needsUpdate = true;

    if (aliveCount === 0) {
      points.visible = false;
    }
  });

  return (
    <points ref={pointsRef} position={position} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          ref={positionAttributeRef}
          attach="attributes-position"
          args={[particleData.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={color}
        size={0.14}
        transparent
        opacity={1}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleBurst;
