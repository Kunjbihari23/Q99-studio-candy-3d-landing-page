import {
  useProgress,
  Html,
  useGLTF,
  Center,
  Sparkles,
  ContactShadows,
  Environment,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ASSETS } from "../../utils/assets";

// All models used across the entire application to ensure they are preloaded
const ALL_MODELS = [
  ASSETS.glb.candyMix,
  ASSETS.glb.candyPrince,
  ASSETS.glb.candyPink,
  ASSETS.glb.candyGreen,
  ASSETS.glb.candyColorFull,
  ASSETS.glb.candyStick,
  ASSETS.glb.candyRed,
];

const CenterPiece = () => {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(ASSETS.glb.candyMix);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 1.5;
      meshRef.current.position.y =
        Math.sin(state.clock.getElapsedTime() * 1.8) * 0.15;
    }
  });

  return (
    <Center top position={[0, 0.4, 0]}>
      <primitive ref={meshRef} object={scene} scale={3.4} />
    </Center>
  );
};

// Dedicated preloader component that doesn't render anything but triggers useGLTF for all models
const AssetPreloader = () => {
  useGLTF(ALL_MODELS[0]);
  useGLTF(ALL_MODELS[1]);
  useGLTF(ALL_MODELS[2]);
  useGLTF(ALL_MODELS[3]);
  useGLTF(ALL_MODELS[4]);
  useGLTF(ALL_MODELS[5]);
  useGLTF(ALL_MODELS[6]);
  return null;
};

const LoaderUI = ({
  progress,
  onComplete,
}: {
  progress: number;
  onComplete: () => void;
}) => {
  const [delayedProgress, setDelayedProgress] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const [flavorText, setFlavorText] = useState("Sugar Rush Initializing");

  useEffect(() => {
    const timer = setInterval(() => {
      setDelayedProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 1200);
          return 100;
        }
        // Artificial easing for a smoother loading feel
        const diff = progress - prev;
        const increment = Math.max(0.1, diff * 0.1);
        return Math.min(prev + increment, progress);
      });
    }, 32);
    return () => clearInterval(timer);
  }, [progress, onComplete]);

  useEffect(() => {
    const textOptions = [
      "Sugar Rush Initializing",
      "Mixing the Jelly",
      "Spinning the Sweetness",
      "Glazing the World",
      "Almost Sweet",
    ];
    const index = Math.min(4, Math.floor(delayedProgress / 20));
    if (textOptions[index] !== flavorText) {
      gsap.to(textRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        onComplete: () => {
          setFlavorText(textOptions[index]);
          gsap.fromTo(
            textRef.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4 },
          );
        },
      });
    }
  }, [delayedProgress, flavorText]);

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center w-[90vw] md:w-[480px]">
        <div className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden backdrop-blur-3xl border border-white/10 p-1 shadow-2xl">
          <div
            className="h-full bg-gradient-to-r from-[#ff5fb2] via-[#ffe38a] to-[#7ef3ff] rounded-full shadow-[0_0_30px_rgba(255,95,178,0.6)]"
            style={{
              width: `${delayedProgress}%`,
              transition: "width 0.1s linear",
            }}
          />
        </div>

        <div className="mt-10 flex flex-col items-center">
          <div
            ref={textRef}
            className="font-orbitron text-white text-xl tracking-[0.45em] uppercase font-black text-center drop-shadow-xl"
          >
            {flavorText}
          </div>
          <span className="mt-4 font-rajdhani text-[#7ef3ff] text-base font-bold tracking-[0.25em]">
            {Math.round(delayedProgress)}% SWEET
          </span>
        </div>
      </div>
    </Html>
  );
};

const CandyLoader = ({ children }: { children: React.ReactNode }) => {
  const { active, progress } = useProgress();
  const [showContent, setShowContent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadingFinished = !active && progress === 100;

  useEffect(() => {
    if (showContent && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: "power2.inOut" },
      );
    }
  }, [showContent]);

  if (showContent) return <div ref={containerRef}>{children}</div>;

  return (
    <div className="fixed inset-0 z-[999] bg-[#0c0411] cursor-wait overflow-hidden">
      <Canvas camera={{ position: [0, 0, 8.5], fov: 42 }}>
        <fog attach="fog" args={["#0c0411", 7, 20]} />

        <Environment preset="night" />
        <ambientLight intensity={0.4} />

        <hemisphereLight
          intensity={2.5}
          color="#ffe3f6"
          groundColor="#0c0411"
        />
        <directionalLight
          position={[5, 10, 5]}
          intensity={2.2}
          color="#ffffff"
          castShadow
        />
        <pointLight position={[-10, 5, 5]} intensity={3.5} color="#89e8ff" />
        <pointLight position={[10, -5, 5]} intensity={2.5} color="#ff68b8" />

        <Suspense fallback={null}>
          <AssetPreloader />
          <group position={[0, -0.6, 0]}>
            <CenterPiece />
            <Sparkles
              count={120}
              scale={15}
              size={1.5}
              speed={0.4}
              opacity={0.3}
              color="#ffe28a"
            />
          </group>

          <ContactShadows
            position={[0, -2.8, 0]}
            opacity={0.42}
            scale={18}
            blur={2.5}
            far={5}
          />

          <LoaderUI
            progress={loadingFinished ? 100 : progress}
            onComplete={() => setShowContent(true)}
          />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,#21072d_0%,#0c0411_100%)]" />
      <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.95)]" />
    </div>
  );
};

// Trigger browser pre-fetch
ALL_MODELS.forEach((asset) => useGLTF.preload(asset));

export default CandyLoader;
