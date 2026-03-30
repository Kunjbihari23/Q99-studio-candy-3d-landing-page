import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Intersection } from "three";
import * as THREE from "three";

type InteractionEvent = unknown;

interface InteractionUserData extends Record<string, unknown> {
  interactive?: boolean;
  onInteractionClick?: (
    object: THREE.Object3D,
    event?: InteractionEvent,
  ) => void;
}

interface InteractionStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => THREE.Object3D | null;
  setHovered: (next: THREE.Object3D | null) => void;
}

interface InteractionContextValue {
  subscribe: InteractionStore["subscribe"];
  getSnapshot: InteractionStore["getSnapshot"];
  handleClick: (event?: InteractionEvent) => THREE.Object3D | null;
}

interface InteractionSystemProps {
  children?: ReactNode;
  autoBindClick?: boolean;
}

const InteractionContext = createContext<InteractionContextValue | null>(null);

const createInteractionStore = (): InteractionStore => {
  let hovered: THREE.Object3D | null = null;
  const listeners = new Set<() => void>();

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => hovered,
    setHovered: (next) => {
      if (hovered === next) {
        return;
      }

      hovered = next;
      listeners.forEach((listener) => listener());
    },
  };
};

const resolveInteractiveTarget = (
  object: THREE.Object3D | null,
): THREE.Object3D | null => {
  let current = object;

  while (current) {
    const userData = current.userData as InteractionUserData;

    if (userData.interactive === true) {
      return current;
    }

    current = current.parent;
  }

  return null;
};

const getFirstInteractiveHit = (
  intersections: Intersection<THREE.Object3D>[],
): THREE.Object3D | null => {
  for (const intersection of intersections) {
    const target = resolveInteractiveTarget(intersection.object);

    if (target) {
      return target;
    }
  }

  return null;
};

export const InteractionSystem = ({
  children,
  autoBindClick = true,
}: InteractionSystemProps) => {
  const { camera, gl, pointer, raycaster, scene } = useThree();

  const storeRef = useRef<InteractionStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createInteractionStore();
  }

  const pickRef = useRef<() => THREE.Object3D | null>(() => null);
  pickRef.current = () => {
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObject(scene, true);
    return getFirstInteractiveHit(intersections);
  };

  const handleClickRef = useRef<
    (event?: InteractionEvent) => THREE.Object3D | null
  >(() => null);
  handleClickRef.current = (event) => {
    const target = pickRef.current() ?? storeRef.current?.getSnapshot() ?? null;

    if (!target) {
      return null;
    }

    const userData = target.userData as InteractionUserData;
    userData.onInteractionClick?.(target, event);

    return target;
  };

  const contextRef = useRef<InteractionContextValue | null>(null);
  if (contextRef.current === null) {
    const store = storeRef.current;
    contextRef.current = {
      subscribe: store.subscribe,
      getSnapshot: store.getSnapshot,
      handleClick: (event) => handleClickRef.current(event),
    };
  }

  useFrame(() => {
    storeRef.current?.setHovered(pickRef.current());
  });

  useEffect(() => {
    const clearHover = () => storeRef.current?.setHovered(null);
    const onPointerDown = (event: PointerEvent) => {
      handleClickRef.current(event);
    };

    gl.domElement.addEventListener("pointerleave", clearHover, {
      passive: true,
    });
    gl.domElement.addEventListener("pointercancel", clearHover, {
      passive: true,
    });

    if (autoBindClick) {
      gl.domElement.addEventListener("pointerdown", onPointerDown, {
        passive: true,
      });
    }

    return () => {
      gl.domElement.removeEventListener("pointerleave", clearHover);
      gl.domElement.removeEventListener("pointercancel", clearHover);
      gl.domElement.removeEventListener("pointerdown", onPointerDown);
      clearHover();
    };
  }, [autoBindClick, gl]);

  return (
    <InteractionContext.Provider value={contextRef.current}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteraction = () => {
  const context = useContext(InteractionContext);

  if (context === null) {
    throw new Error("useInteraction must be used inside <InteractionSystem />");
  }

  const hoveredObject = useSyncExternalStore(
    context.subscribe,
    context.getSnapshot,
    context.getSnapshot,
  );

  return {
    hoveredObject,
    handleClick: context.handleClick,
  };
};
