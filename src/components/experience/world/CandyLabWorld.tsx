import { useCallback, useState } from "react";
import { useThree } from "@react-three/fiber";
import CandyBlob from "../../candy/CandyBlob";
import ParticleBurst from "../../../systems/ParticleBurst";
import { useSound } from "../../../systems/useSound";

interface BurstState {
  id: number;
  position: [number, number, number];
}

let burstId = 0;

const CandyLabWorld = () => {
  const [burst, setBurst] = useState<BurstState | null>(null);
  const { viewport } = useThree();
  const isMobile = viewport.width <= 6;
  const sceneX = isMobile ? 0.7 : 1.3;
  const sceneScale = isMobile ? 0.75 : 0.95;
  const { playBurst } = useSound({ volume: 0.12 });

  const handleRelease = useCallback(
    (position: [number, number, number]) => {
      burstId += 1;
      setBurst({ id: burstId, position });
      playBurst();
    },
    [playBurst],
  );

  return (
    <group position={[sceneX, 0, 0]} scale={sceneScale}>
      <ambientLight intensity={0.45} />
      <hemisphereLight intensity={0.6} color="#ffe3f6" groundColor="#1a0629" />
      <directionalLight position={[4, 5, 3]} intensity={1.2} color="#fff5fb" />
      <pointLight
        position={[-3, 1, 4]}
        intensity={9}
        distance={12}
        color="#5fe0ff"
      />
      <pointLight
        position={[3, 2, 3]}
        intensity={8}
        distance={11}
        color="#ff68b8"
      />

      <group position={[0, -0.45, 0]}>
        <mesh
          position={[0, -1.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[3.8, 64]} />
          <meshBasicMaterial color="#1b0928" transparent opacity={0.9} />
        </mesh>

        <mesh position={[0, -1.4, 0]}>
          <cylinderGeometry args={[1.3, 1.65, 0.55, 64]} />
          <meshStandardMaterial
            color="#4b1764"
            metalness={0.22}
            roughness={0.28}
            emissive="#21072d"
            emissiveIntensity={0.24}
          />
        </mesh>

        <mesh position={[0, -1.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.15, 1.8, 64]} />
          <meshBasicMaterial color="#7ef3ff" transparent opacity={0.25} />
        </mesh>

        <CandyBlob position={[0, 0.3, 0]} onRelease={handleRelease} />
      </group>

      {burst ? (
        <ParticleBurst
          key={burst.id}
          position={burst.position}
          color="#fff1a8"
          count={36}
        />
      ) : null}
    </group>
  );
};

export default CandyLabWorld;
