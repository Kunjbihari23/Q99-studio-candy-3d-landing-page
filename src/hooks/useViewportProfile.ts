import { useEffect, useState } from "react";

type NavigatorWithHints = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
  deviceMemory?: number;
};

export interface ViewportProfile {
  width: number;
  height: number;
  aspectRatio: number;
  isMobile: boolean;
  uiScale: number;
  sceneScale: number;
  cameraDepthMultiplier: number;
  cameraFov: number;
  heroScale: number;
  canvasDpr: number;
  lowEndDevice: boolean;
  heroBubbleCount: number;
}

const getLowEndDevice = (): boolean => {
  const nav = navigator as NavigatorWithHints;
  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const connectionType = nav.connection?.effectiveType ?? "";
  const prefersDataSaving = nav.connection?.saveData ?? false;

  return (
    prefersDataSaving ||
    memory <= 4 ||
    cores <= 4 ||
    connectionType.includes("2g") ||
    connectionType.includes("3g")
  );
};

const getViewportProfile = (): ViewportProfile => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width <= 768;
  const lowEndDevice = getLowEndDevice();
  const aspectRatio = width / height;
  const isWideScreen = aspectRatio > 2.2; // Ultrawide or very wide short screens

  let uiScale = 1;
  if (width <= 420) uiScale = 0.84;
  else if (width <= 768) uiScale = 0.89;
  else if (width <= 1024) uiScale = 0.93;
  else if (width <= 1280) uiScale = 0.96;

  let sceneScale = 1;
  if (width <= 420) sceneScale = 0.8;
  else if (width <= 768) sceneScale = 0.86;
  else if (width <= 1024) sceneScale = 0.92;
  else if (width <= 1280) sceneScale = 0.96;

  let cameraDepthMultiplier = 1;
  if (width <= 420) cameraDepthMultiplier = 1.32;
  else if (width <= 768) cameraDepthMultiplier = 1.22;
  else if (width <= 1024) cameraDepthMultiplier = 1.12;
  else if (width <= 1280) cameraDepthMultiplier = 1.06;

  let cameraFov = 34;
  if (width <= 420) cameraFov = 43;
  else if (width <= 768) cameraFov = 40;
  else if (width <= 1024) cameraFov = 37;

  // Adjust FOV for wide screens to cover full width
  if (isWideScreen) {
    cameraFov = Math.max(cameraFov, 45);
  }

  let heroScale = 0.82;
  if (width <= 420) heroScale = 0.62;
  else if (width <= 768) heroScale = 0.7;
  else if (width <= 1024) heroScale = 0.76;

  const maxDpr = lowEndDevice ? 1 : 1.35;
  const canvasDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const heroBubbleCount = lowEndDevice ? 30 : 48;

  return {
    width,
    height,
    aspectRatio,
    isMobile,
    uiScale,
    sceneScale,
    cameraDepthMultiplier,
    cameraFov,
    heroScale,
    canvasDpr,
    lowEndDevice,
    heroBubbleCount,
  };
};

export const useViewportProfile = (): ViewportProfile => {
  const [profile, setProfile] = useState<ViewportProfile>(() =>
    getViewportProfile(),
  );

  useEffect(() => {
    const updateProfile = () => {
      setProfile(getViewportProfile());
    };

    updateProfile();
    window.addEventListener("resize", updateProfile, { passive: true });
    window.visualViewport?.addEventListener("resize", updateProfile, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", updateProfile);
      window.visualViewport?.removeEventListener("resize", updateProfile);
    };
  }, []);

  return profile;
};
