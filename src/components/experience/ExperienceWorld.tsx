/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Suspense,
  lazy,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { useViewportProfile } from "../../hooks/useViewportProfile";
import {
  useScrollCamera,
  type CameraPose,
} from "../../systems/useScrollCamera";
import { ASSETS } from "../../utils/assets";
import HeroSection from "../hero/Hero";
import SodaScene from "../soda/SodaScene";

const LazyCandyLabWorld = lazy(() => import("./world/CandyLabWorld"));
const LazyMatch3World = lazy(() => import("./world/Match3World"));
const LazyPowerupWorld = lazy(() => import("./world/PowerupWorld"));
const LazyLeaderboardWorld = lazy(() => import("./world/LeaderboardWorld"));

const SCENE_DEPTH = [0, -10, -20, -30, -40] as const;
const SCENE_X = [0, -2.25, 2.25, -2.25, 2.25] as const;

interface Match3HintAnchorDetail {
  x: number;
  y: number;
  visible: boolean;
}

const Match3HintOverlay = ({ enabled }: { enabled: boolean }) => {
  const [anchor, setAnchor] = useState<Match3HintAnchorDetail>(() => ({
    x: typeof window === "undefined" ? 0 : window.innerWidth / 2,
    y: typeof window === "undefined" ? 0 : window.innerHeight * 0.2,
    visible: false,
  }));

  useEffect(() => {
    const handleAnchor = (event: Event) => {
      const customEvent = event as CustomEvent<Match3HintAnchorDetail>;
      if (!customEvent.detail) {
        return;
      }
      setAnchor(customEvent.detail);
    };

    window.addEventListener("match3-hint-anchor", handleAnchor);
    return () => window.removeEventListener("match3-hint-anchor", handleAnchor);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-30 rounded-lg border border-cyan-200/40 bg-black/60 px-3 py-2 text-center shadow-[0_0_22px_rgba(120,237,255,0.28)] backdrop-blur-sm transition-opacity duration-150"
      style={{
        left: anchor.x,
        top: anchor.y,
        transform: "translate(-50%, -130%)",
        opacity: anchor.visible ? 1 : 0,
      }}
    >
      <p className="font-orbitron text-[9px] uppercase tracking-[0.22em] text-cyan-200">
        Playable
      </p>
      <p className="mt-1 font-rajdhani text-xs font-semibold text-white/95 sm:text-sm">
        Drag candies or tap two adjacent
      </p>
    </div>
  );
};

// Camera pose generator based on viewport-derived depth multiplier.
const getResponsiveCameraPoses = (depthMultiplier: number): CameraPose[] => {
  return [
    { position: [0, 0.4, 7.4 * depthMultiplier], rotation: [0.02, 0, 0] },
    {
      position: [0.25, -9.6, 6.6 * depthMultiplier],
      rotation: [0.08, -0.05, 0.02],
    },
    { position: [0, -19.7, 8.4 * depthMultiplier], rotation: [0.06, 0, 0] },
    {
      position: [1.1, -29.8, 8.8 * depthMultiplier],
      rotation: [0.07, -0.08, 0.02],
    },
    { position: [0, -39.4, 10.6 * depthMultiplier], rotation: [0.05, 0.02, 0] },
  ];
};

const HeroWorld = ({
  scale,
  bubbleCount,
  aspectRatio,
}: {
  scale: number;
  bubbleCount: number;
  aspectRatio: number;
}) => {
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
    <group position={[0, -0.6, 0]} scale={scale}>
      <ambientLight intensity={0.5} />
      <SodaScene
        progress={progress}
        color="#ff68b8"
        bubbleCount={bubbleCount}
        direction="up"
        aspectRatio={aspectRatio}
      />
    </group>
  );
};

// preload
[
  ASSETS.glb.candyPink,
  ASSETS.glb.candyGreen,
  ASSETS.glb.candyMix,
  ASSETS.glb.candyRed,
  ASSETS.glb.candyColorFull,
  ASSETS.glb.candyStick,
].forEach((m) => useGLTF.preload(m));

// camera rig
const CameraRig = ({ targetRef }: any) => {
  const q = useRef(new THREE.Quaternion());

  useFrame(({ camera }, delta) => {
    camera.position.lerp(
      targetRef.current.position,
      1 - Math.exp(-4.5 * delta),
    );
    q.current.setFromEuler(targetRef.current.rotation);
    camera.quaternion.slerp(q.current, 1 - Math.exp(-4.2 * delta));
  });

  return null;
};

// scene proxy
const SceneProxy = memo(({ color }: { color: string }) => (
  <group>
    <mesh>
      <octahedronGeometry args={[0.64, 0]} />
      <meshBasicMaterial color={color} transparent opacity={0.38} />
    </mesh>
  </group>
));

// scene slot
const SceneSlot = ({
  activeSceneIndex,
  index,
  position,
  scale,
  centered,
  Scene,
}: any) => {
  const show =
    index === activeSceneIndex ||
    index === activeSceneIndex + 1 ||
    index === activeSceneIndex - 1;

  return (
    <group position={position} scale={scale ?? 1}>
      {show ? (
        <Suspense fallback={<SceneProxy color="#fff" />}>
          <Scene activeIndex={activeSceneIndex} centered={centered} />
        </Suspense>
      ) : (
        <SceneProxy color="#fff" />
      )}
    </group>
  );
};

interface ExperienceCanvasProps {
  activeSceneIndex: number;
  targetRef: any;
  isSmallDevice: number;
  isCompactLayout: boolean;
  poses: CameraPose[];
  sceneScale: number;
  canvasDpr: number;
  cameraFov: number;
  heroScale: number;
  bubbleCount: number;
  lowEndDevice: boolean;
  aspectRatio: number;
}

const ExperienceCanvas = ({
  activeSceneIndex,
  targetRef,
  isSmallDevice,
  isCompactLayout,
  poses,
  sceneScale,
  canvasDpr,
  cameraFov,
  heroScale,
  bubbleCount,
  lowEndDevice,
  aspectRatio,
}: ExperienceCanvasProps) => {
  const compactSceneShiftY = isCompactLayout ? -0.9 : 0;
  const isMobile = isSmallDevice < 1024;

  return (
    <Canvas
      className="fixed inset-0 w-full h-full"
      style={{ width: "100vw", height: "100vh" }}
      dpr={canvasDpr}
      gl={{
        antialias: !lowEndDevice,
        alpha: true,
        powerPreference: lowEndDevice ? "low-power" : "high-performance",
      }}
      performance={{ min: lowEndDevice ? 0.45 : 0.65 }}
      camera={{
        position: poses[0].position,
        fov: cameraFov,
        near: 0.1,
        far: 120,
      }}
    >
      <CameraRig targetRef={targetRef} />

      <group scale={sceneScale}>
        <group position={[0, SCENE_DEPTH[0], 0]}>
          <HeroWorld
            scale={heroScale}
            bubbleCount={bubbleCount}
            aspectRatio={aspectRatio}
          />
        </group>

        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={1}
          position={[
            isCompactLayout || isMobile ? 0 : SCENE_X[1],
            SCENE_DEPTH[1] + compactSceneShiftY,
            0,
          ]}
          scale={isMobile ? 0.78 : 0.95}
          Scene={LazyCandyLabWorld}
          proxyColor="#ff85c2"
          centered={isCompactLayout}
        />
        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={2}
          position={[
            isCompactLayout || isMobile ? 0 : SCENE_X[2],
            SCENE_DEPTH[2] + compactSceneShiftY,
            0,
          ]}
          scale={isMobile ? 0.72 : 0.9}
          Scene={LazyMatch3World}
          proxyColor="#00d8ff"
          centered={isCompactLayout}
        />
        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={3}
          position={[
            isCompactLayout || isMobile ? 0 : SCENE_X[3],
            SCENE_DEPTH[3] + compactSceneShiftY,
            0,
          ]}
          scale={isMobile ? 0.74 : 0.9}
          Scene={LazyPowerupWorld}
          proxyColor="#ffe24a"
          centered={isCompactLayout}
        />
        <SceneSlot
          activeSceneIndex={activeSceneIndex}
          index={4}
          position={[
            isCompactLayout || isMobile ? 0 : SCENE_X[4],
            SCENE_DEPTH[4] + compactSceneShiftY,
            0,
          ]}
          scale={isMobile ? 0.7 : 0.85}
          Scene={LazyLeaderboardWorld}
          proxyColor="#a3ffbd"
          centered={isCompactLayout}
        />
      </group>
    </Canvas>
  );
};

// main
const ExperienceWorld = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const profile = useViewportProfile();
  const [showMatch3Hint, setShowMatch3Hint] = useState(true);
  const isCompactLayout = profile.width <= 1024;

  const poses = useMemo(
    () => getResponsiveCameraPoses(profile.cameraDepthMultiplier),
    [profile.cameraDepthMultiplier],
  );

  const { activeSceneIndex, targetRef } = useScrollCamera({
    containerRef,
    poses,
  });
  const showHeroOverlay = activeSceneIndex === 0;
  const hideSections = activeSceneIndex === 0;

  useEffect(() => {
    const handleUserInteraction = () => setShowMatch3Hint(false);
    window.addEventListener("match3-user-interacted", handleUserInteraction);
    return () =>
      window.removeEventListener(
        "match3-user-interacted",
        handleUserInteraction,
      );
  }, []);

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

  return (
    <div ref={containerRef} className="relative bg-[#12061f] h-[480vh]">
      <div className="fixed inset-0 h-full w-full">
        <ExperienceCanvas
          activeSceneIndex={activeSceneIndex}
          targetRef={targetRef}
          isSmallDevice={profile.width}
          isCompactLayout={isCompactLayout}
          poses={poses}
          sceneScale={profile.sceneScale}
          canvasDpr={profile.canvasDpr}
          cameraFov={profile.cameraFov}
          heroScale={profile.heroScale}
          bubbleCount={profile.heroBubbleCount}
          lowEndDevice={profile.lowEndDevice}
          aspectRatio={profile.aspectRatio}
        />
      </div>

      <Match3HintOverlay enabled={showMatch3Hint && activeSceneIndex === 2} />

      <div
        className="relative z-20 pointer-events-none"
        style={{
          transform: `scale(${profile.uiScale})`,
          width: "100%",
          transformOrigin: "top center",
        }}
      >
        <section
          className="pointer-events-auto flex min-h-screen items-center transition-opacity duration-400"
          style={{
            opacity: showHeroOverlay ? 1 : 0,
            visibility: showHeroOverlay ? "visible" : "hidden",
          }}
        >
          <div className="container-custom">
            <HeroSection />
          </div>
        </section>
        <div
          style={{
            opacity: hideSections ? 0 : 1,
            visibility: hideSections ? "hidden" : "visible",
            transition: "opacity 200ms ease",
          }}
        >
          {SECTION_COPY.map((section) => {
            const isRight = section.align === "right";
            const sectionAlignmentClass = isCompactLayout
              ? "justify-items-center"
              : isRight
                ? "justify-items-end"
                : "justify-items-start";

            return (
              <section
                key={section.eyebrow}
                className={`pointer-events-none flex min-h-screen ${
                  isCompactLayout
                    ? "items-start pt-16 sm:pt-24"
                    : "items-center"
                }`}
                style={{ contentVisibility: "auto" }}
              >
                <div
                  className={`container-custom grid w-full ${sectionAlignmentClass}`}
                >
                  <div className="max-w-xl rounded-4xl border border-white/12 bg-black/18 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8 lg:p-10">
                    <span className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-1 font-orbitron text-xs uppercase tracking-[0.3em] text-[#ffe8f8]">
                      {section.eyebrow}
                    </span>
                    <h2 className="mt-6 font-orbitron text-3xl text-white sm:text-4xl lg:text-6xl">
                      {section.title}
                    </h2>
                    <p className="mt-5 max-w-lg font-rajdhani text-base leading-7 text-white/72 sm:text-lg sm:leading-8 lg:text-xl">
                      {section.body}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExperienceWorld;
