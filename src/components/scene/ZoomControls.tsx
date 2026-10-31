import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect } from "react";

export function ZoomControls({
  chapterId,
  baseFov = 55,
  minFov = 15,
  maxFov = 85,
}: {
  chapterId?: string;
  baseFov?: number;
  minFov?: number;
  maxFov?: number;
}) {
  const { camera, gl } = useThree();
  const targetFov = useRef(chapterId === "wormhole" ? 60 : baseFov);

  useEffect(() => {
    targetFov.current = chapterId === "wormhole" ? 60 : baseFov;
  }, [chapterId, baseFov]);

  useEffect(() => {
    const el = gl.domElement;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.045;
      targetFov.current = THREE.MathUtils.clamp(targetFov.current + delta, minFov, maxFov);
    };

    const reset = () => {
      targetFov.current = chapterId === "wormhole" ? 60 : baseFov;
    };

    let pinchStart = 0;
    let pinchFov = baseFov;
    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart = dist(e.touches);
        pinchFov = targetFov.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStart > 0) {
        e.preventDefault();
        const ratio = dist(e.touches) / pinchStart;
        targetFov.current = THREE.MathUtils.clamp(pinchFov / ratio, minFov, maxFov);
      }
    };

    el.addEventListener("wheel", handler, { passive: false });
    el.addEventListener("dblclick", reset);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("wheel", handler);
      el.removeEventListener("dblclick", reset);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [gl, chapterId, baseFov, minFov, maxFov]);

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - targetFov.current) > 0.01) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov.current, Math.min(1, dt * 6.5));
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

