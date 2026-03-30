import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Suspense,
  lazy,
  memo,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import * as THREE from "three";
import { InteractionSystem } from "../../systems/interaction";
import {
  useScrollCamera,
  type CameraPose,
} from "../../systems/useScrollCamera";
import HeroSection from "../hero/Hero";
import SodaScene from "../soda/SodaScene";

const LazyCandyLabWorld = lazy(() => import("./world/CandyLabWorld"));
const LazyMatch3World = lazy(() => import("./world/Match3World"));
const LazyPowerupWorld = lazy(() => import("./world/PowerupWorld"));
const LazyLeaderboardWorld = lazy(() => import("./world/LeaderboardWorld"));

interface SceneProps {
  activeIndex: number;
}

const SCENE_DEPTH = [0, -10, -20, -30, -40] as const;
const SCENE_X = [0, -2.25, 2.25, -2.25, 2.25] as const;

const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    update(mediaQuery);
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return isMobile;
};

const CAMERA_POSES: readonly CameraPose[] = [
  { position: [0, 0.4, 7.4], rotation: [0.02, 0, 0] },
  { position: [0.25, -9.6, 6.6], rotation: [0.08, -0.05, 0.02] },
  { position: [0, -19.7, 8.4], rotation: [0.06, 0, 0] },
  { position: [1.1, -29.8, 8.8], rotation: [0.07, -0.08, 0.02] },
  { position: [0, -39.4, 10.6], rotation: [0.05, 0.02, 0] },
];

const SECTION_COPY = [
  {
    eyebrow: "About",
    title: "Fun & Relaxing Game",
    body: "Enjoy satisfying candy matches designed to relax your mind while keeping every move exciting.",
    align: "right",
  },
  {
    eyebrow: "Levels",
    title: "Hundreds of Handcrafted Candy Levels",
    body: "Explore carefully designed levels that bring fresh challenges and sweet surprise at every stage.",
    align: "left",
  },
  {
    eyebrow: "Graphics",
    title: "Smooth Controls & Colourful Graphics",
    body: "Experience seamless gameplay with vibrant visuals that make every candy pop burst with life.",
    align: "right",
  },
  {
    eyebrow: "Gameplay",
    title: "Easy to play, Challenging to Master",
    body: "Jump in instantly with simple mechanics, then test your strategy as the difficulty grows.",
    align: "left",
  },
] as const;

const HeroWorld = () => {
  const progress = useRef({ value: 0 });
  const startTimeRef = useRef(0);

  useFrame(({ clock }) => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = clock.getElapsedTime();
    }
    const elapsed = clock.getElapsedTime() - startTimeRef.current;
    const t = Math.min(elapsed / 2, 1);
    const baseProgress = t * 0.85;
    progress.current.value =
      baseProgress +
      Math.sin((clock.getElapsedTime() - startTimeRef.current) * 0.7) * 0.08;
  });

  return (
    <group position={[0, -0.6, 0]} scale={0.82}>
      <ambientLight intensity={0.5} />
      <SodaScene
        progress={progress}
        color="#ff68b8"
        bubbleCount={48}
        direction="up"
      />
    </group>
  );
};

useGLTF.preload("/Glb-Models/candy_pink.glb");
useGLTF.preload("/Glb-Models/candy_model_green.glb");
useGLTF.preload("/Glb-Models/Mix_candy.glb");
useGLTF.preload("/Glb-Models/red_candy_monster.glb");
useGLTF.preload("/Glb-Models/Color_Full_Candy.glb");
useGLTF.preload("/Glb-Models/candy_stick.glb");

const CameraRig = ({
  targetRef,
}: {
  targetRef: React.MutableRefObject<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
  }>;
}) => {
  const targetQuaternion = useRef(new THREE.Quaternion());

  useFrame(({ camera }, delta) => {
    camera.position.lerp(
      targetRef.current.position,
      1 - Math.exp(-4.5 * delta),
    );
    targetQuaternion.current.setFromEuler(targetRef.current.rotation);
    camera.quaternion.slerp(
      targetQuaternion.current,
      1 - Math.exp(-4.2 * delta),
    );
  });

  return null;
};

const SceneProxy = memo(({ color }: { color: string }) => {
  return (
    <group>
      <mesh>
        <octahedronGeometry args={[0.64, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.38} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <ringGeometry args={[0.75, 1.25, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
    </group>
  );
});

SceneProxy.displayName = "SceneProxy";

const SceneSlot = ({
  activeSceneIndex,
  index,
  position,
  scale,
  Scene,
  proxyColor,
}: {
  activeSceneIndex: number;
  index: number;
  position: readonly [number, number, number];
  scale?: number;
  Scene: LazyExoticComponent<ComponentType<SceneProps>>;
  proxyColor: string;
}) => {
  const shouldMount =
    index === activeSceneIndex ||
    index === activeSceneIndex + 1 ||
    index === activeSceneIndex - 1;

  return (
    <group position={position} scale={scale ?? 1}>
      {shouldMount ? (
        <Suspense fallback={<SceneProxy color={proxyColor} />}>
          <Scene activeIndex={activeSceneIndex} />
        </Suspense>
      ) : (
        <SceneProxy color={proxyColor} />
      )}
    </group>
  );
};

const ExperienceCanvas = ({
  activeSceneIndex,
  targetRef,
  isMobile,
}: {
  activeSceneIndex: number;
  targetRef: React.MutableRefObject<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
  }>;
  isMobile: boolean;
}) => {
  return (
    <Canvas
      className="absolute inset-0 pointer-events-auto"
      style={{ pointerEvents: "auto" }}
      dpr={[0.75, 1]}
      camera={{
        position: CAMERA_POSES[0].position,
        fov: 34,
        near: 0.1,
        far: 120,
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      shadows={false}
    >
      <color attach="background" args={["#12061f"]} />
      <fog attach="fog" args={["#12061f", 10, 30]} />
      <InteractionSystem>
        <CameraRig targetRef={targetRef} />
        {/* <AmbientCandyDust />? */}

        <group position={[0, SCENE_DEPTH[0], 0]}>
          <HeroWorld />
        </group>
        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={1}
          position={[isMobile ? 0 : SCENE_X[1], SCENE_DEPTH[1], 0]}
          scale={isMobile ? 0.78 : 0.95}
          Scene={LazyCandyLabWorld}
          proxyColor="#ff85c2"
        />
        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={2}
          position={[isMobile ? 0 : SCENE_X[2], SCENE_DEPTH[2], 0]}
          scale={isMobile ? 0.72 : 0.9}
          Scene={LazyMatch3World}
          proxyColor="#00d8ff"
        />
        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={3}
          position={[isMobile ? 0 : SCENE_X[3], SCENE_DEPTH[3], 0]}
          scale={isMobile ? 0.74 : 0.9}
          Scene={LazyPowerupWorld}
          proxyColor="#ffe24a"
        />
        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={4}
          position={[isMobile ? 0 : SCENE_X[4], SCENE_DEPTH[4], 0]}
          scale={isMobile ? 0.7 : 0.85}
          Scene={LazyLeaderboardWorld}
          proxyColor="#a3ffbd"
        />
      </InteractionSystem>
    </Canvas>
  );
};

const ExperienceWorld = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useResponsiveLayout();
  const { activeSceneIndex, targetRef } = useScrollCamera({
    containerRef,
    poses: CAMERA_POSES,
  });

  return (
    <div ref={containerRef} className="relative isolate bg-[#12061f]">
      <div className="fixed inset-0 z-0">
        <ExperienceCanvas
          activeSceneIndex={activeSceneIndex}
          targetRef={targetRef}
          isMobile={isMobile}
        />
      </div>

      <div className="relative z-20 pointer-events-none">
        <section
          className="pointer-events-none flex min-h-screen items-center"
          style={{ contentVisibility: "auto" }}
        >
          <div className="container-custom pointer-events-auto">
            <HeroSection />
          </div>
        </section>

        {SECTION_COPY.map((section) => {
          const isRight = section.align === "right";
          return (
            <section
              key={section.eyebrow}
              className="pointer-events-none flex min-h-screen items-center"
              style={{ contentVisibility: "auto" }}
            >
              <div
                className={`container-custom grid w-full ${
                  isRight ? "justify-items-end" : "justify-items-start"
                }`}
              >
                <div className="pointer-events-auto max-w-xl rounded-4xl border border-white/12 bg-black/18 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md md:p-10">
                  <span className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-1 font-orbitron text-xs uppercase tracking-[0.3em] text-[#ffe8f8]">
                    {section.eyebrow}
                  </span>
                  <h2 className="mt-6 font-orbitron text-4xl text-white md:text-6xl">
                    {section.title}
                  </h2>
                  <p className="mt-6 max-w-lg font-rajdhani text-lg leading-8 text-white/72 md:text-xl">
                    {section.body}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default ExperienceWorld;
