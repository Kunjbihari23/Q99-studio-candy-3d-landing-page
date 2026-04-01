import { Clone, useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { memo, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { useMicroMotion } from "../../systems/useMicroMotion";
import { ASSETS } from "../../utils/assets";

useGLTF.preload(ASSETS.glb.candyPrince);

interface CandyBlobProps {
  position?: readonly [number, number, number];
  color?: THREE.ColorRepresentation;
  onRelease?: (sparklePosition: [number, number, number]) => void;
}

const MAX_STRETCH = 1.15;

const setCursor = (value: string) => {
  if (typeof document !== "undefined") {
    document.body.style.cursor = value;
  }
};

const CandyBlob = memo(
  ({ position = [0, 0, 0], onRelease }: CandyBlobProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF(ASSETS.glb.candyPrince);
    const dragPlaneRef = useRef(new THREE.Plane());
    const dragDirectionRef = useRef(new THREE.Vector3(0, 1, 0));
    const releaseDirectionRef = useRef(new THREE.Vector3(0, 1, 0));
    const planeNormalRef = useRef(new THREE.Vector3());
    const worldCenterRef = useRef(new THREE.Vector3());
    const intersectionPointRef = useRef(new THREE.Vector3());
    const dragVectorRef = useRef(new THREE.Vector3());
    const draggingRef = useRef(false);
    const hoverRef = useRef(false);
    const stretchRef = useRef(0);
    const targetStretchRef = useRef(0);
    const bounceTimeRef = useRef(999);
    const bounceStrengthRef = useRef(0);
    const shellRef = useRef<THREE.Group>(null);

    const microMotion = useMicroMotion({
      floatAmplitude: 0.1,
      floatSpeed: 1.1,
      hoverScale: 1.06,
      bounceStrength: 0.08,
      baseGlow: 0.12,
      hoverGlow: 0.18,
    });
    const updateDragTarget = useCallback((event: ThreeEvent<PointerEvent>) => {
      const group = groupRef.current;

      if (!group) {
        return;
      }

      group.getWorldPosition(worldCenterRef.current);
      event.camera.getWorldDirection(planeNormalRef.current).multiplyScalar(-1);
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(
        planeNormalRef.current,
        worldCenterRef.current,
      );

      if (
        !event.ray.intersectPlane(
          dragPlaneRef.current,
          intersectionPointRef.current,
        )
      ) {
        return;
      }

      dragVectorRef.current
        .copy(intersectionPointRef.current)
        .sub(worldCenterRef.current);

      const distance = dragVectorRef.current.length();
      if (distance <= 0.0001) {
        return;
      }

      dragVectorRef.current.multiplyScalar(1 / distance);
      dragDirectionRef.current.lerp(dragVectorRef.current, 0.32).normalize();
      releaseDirectionRef.current.copy(dragDirectionRef.current);
      targetStretchRef.current = THREE.MathUtils.clamp(
        distance / 1.6,
        0,
        MAX_STRETCH,
      );
    }, []);

    const releaseBlob = useCallback(() => {
      if (!draggingRef.current) {
        return;
      }

      draggingRef.current = false;
      targetStretchRef.current = 0;
      bounceTimeRef.current = 0;
      bounceStrengthRef.current = Math.max(0.28, stretchRef.current);
      microMotion.triggerBounce(1);

      const group = groupRef.current;
      if (group) {
        group.getWorldPosition(worldCenterRef.current);
        const sparklePosition = worldCenterRef.current
          .clone()
          .addScaledVector(releaseDirectionRef.current, 1.05);
        onRelease?.([sparklePosition.x, sparklePosition.y, sparklePosition.z]);
      }

      setCursor(hoverRef.current ? "grab" : "");
    }, [onRelease, microMotion]);

    useEffect(() => {
      const handleWindowPointerUp = () => releaseBlob();

      window.addEventListener("pointerup", handleWindowPointerUp, {
        passive: true,
      });

      return () => {
        window.removeEventListener("pointerup", handleWindowPointerUp);
        setCursor("");
      };
    }, [releaseBlob]);

    useFrame(({ clock }, delta) => {
      const shell = shellRef.current;
      if (!shell) {
        return;
      }

      const micro = microMotion.sample(clock.getElapsedTime(), delta);
      const targetStretch = draggingRef.current ? targetStretchRef.current : 0;
      stretchRef.current = THREE.MathUtils.damp(
        stretchRef.current,
        targetStretch,
        draggingRef.current ? 10 : 7,
        delta,
      );

      let bounce = 0;
      if (bounceTimeRef.current < 6) {
        bounceTimeRef.current += delta;
        bounce =
          Math.sin(bounceTimeRef.current * 15) *
          Math.exp(-bounceTimeRef.current * 4.5) *
          bounceStrengthRef.current;
      }

      const verticalScale =
        (1 + stretchRef.current * 0.18 + bounce * 0.11) * micro.scale;
      const horizontalScale =
        (1 - stretchRef.current * 0.07 - bounce * 0.06) *
        (1 + (micro.scale - 1) * 0.55);
      shell.position.y = micro.floatOffset;
      shell.scale.set(horizontalScale, verticalScale, horizontalScale);
      shell.rotation.x = THREE.MathUtils.damp(
        shell.rotation.x,
        -dragDirectionRef.current.z * 0.16,
        8,
        delta,
      );
      shell.rotation.z = THREE.MathUtils.damp(
        shell.rotation.z,
        dragDirectionRef.current.x * 0.16,
        8,
        delta,
      );

      shell.rotation.y += delta * 0.8;
    });

    const handlePointerDown = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();

        // Use the underlying DOM element for pointer capture
        const pointerTarget = event.nativeEvent.target as HTMLElement;
        if (pointerTarget && pointerTarget.setPointerCapture) {
          pointerTarget.setPointerCapture(event.pointerId);
        }

        draggingRef.current = true;
        bounceStrengthRef.current = 0;
        updateDragTarget(event);
        setCursor("grabbing");
      },
      [updateDragTarget],
    );

    const handlePointerMove = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!draggingRef.current) {
          return;
        }

        event.stopPropagation();
        updateDragTarget(event);
      },
      [updateDragTarget],
    );

    const handlePointerUp = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const pointerTarget = event.target as Element & {
          releasePointerCapture?: (pointerId: number) => void;
        };
        pointerTarget.releasePointerCapture?.(event.pointerId);
        releaseBlob();
      },
      [releaseBlob],
    );

    const handlePointerOver = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        hoverRef.current = true;
        microMotion.handlePointerOver(event);
        if (!draggingRef.current) {
          setCursor("grab");
        }
      },
      [microMotion],
    );

    const handlePointerOut = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        hoverRef.current = false;
        microMotion.handlePointerOut(event);
        if (!draggingRef.current) {
          setCursor("");
        }
      },
      [microMotion],
    );

    return (
      <group ref={groupRef} position={position}>
        <group
          ref={shellRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <Clone object={scene} scale={2.8} />
        </group>
      </group>
    );
  },
);

CandyBlob.displayName = "CandyBlob";

export default CandyBlob;
