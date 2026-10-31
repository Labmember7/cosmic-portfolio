import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import type { Chapter } from "@/config/story";

export function CameraRig({ chapter }: { chapter: Chapter }) {
  const { camera } = useThree();
  const finalPos = useMemo(() => new THREE.Vector3(...chapter.camera), [chapter]);
  const finalLook = useMemo(() => new THREE.Vector3(...chapter.lookAt), [chapter]);
  const viaPos = useMemo(() => (chapter.via ? new THREE.Vector3(...chapter.via.camera) : null), [chapter]);
  const viaLook = useMemo(() => (chapter.via ? new THREE.Vector3(...chapter.via.lookAt) : null), [chapter]);
  const lookHelper = useMemo(() => new THREE.Object3D(), []);

  // Relative look offset from camera position to target point (avoids flipping on reverse travel)
  const currentLookOffset = useRef(
    new THREE.Vector3(
      chapter.lookAt[0] - chapter.camera[0],
      chapter.lookAt[1] - chapter.camera[1],
      chapter.lookAt[2] - chapter.camera[2],
    ),
  );

  // Persistent right-click drag angle (yaw, pitch) with fluid target damping
  const targetDragAngle = useRef({ yaw: 0, pitch: 0 });
  const dragAngle = useRef({ yaw: 0, pitch: 0 });
  const isDraggingRight = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const phase = useRef<"via" | "final">("final");

  // Prevent right-click context menu and track right-drag rotation
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        isDraggingRight.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = "grabbing";
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRight.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        // Snappy, fluid, inverted scene-grab drag with refined sensitivity
        const sensitivity = 0.0032;
        const nextYaw = targetDragAngle.current.yaw + dx * sensitivity;
        targetDragAngle.current.yaw = Math.atan2(Math.sin(nextYaw), Math.cos(nextYaw));
        targetDragAngle.current.pitch = THREE.MathUtils.clamp(
          targetDragAngle.current.pitch + dy * sensitivity,
          -0.85,
          0.85,
        );
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isDraggingRight.current = false;
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // When chapter changes, reset via phase and cleanly initialize wormhole return target
  useEffect(() => {
    phase.current = chapter.via ? "via" : "final";
    if (chapter.id === "wormhole") {
      targetDragAngle.current.yaw = 0;
      targetDragAngle.current.pitch = 0;
      dragAngle.current.yaw = Math.atan2(
        Math.sin(dragAngle.current.yaw),
        Math.cos(dragAngle.current.yaw),
      );
    }
  }, [chapter]);

  useFrame((_, dt) => {
    const isWormhole = chapter.id === "wormhole";

    // At the wormhole rift, snap target angle to default 0
    if (isWormhole && !isDraggingRight.current) {
      targetDragAngle.current.yaw = 0;
      targetDragAngle.current.pitch = 0;
    }

    // Snappy, ultra-fluid cinematic damping (reaches target instantaneously without stepping)
    const dampSpeed = isWormhole ? 5.5 : 24.0;
    const dampFactor = Math.min(1, dt * dampSpeed);
    const diffYaw = Math.atan2(
      Math.sin(targetDragAngle.current.yaw - dragAngle.current.yaw),
      Math.cos(targetDragAngle.current.yaw - dragAngle.current.yaw),
    );
    dragAngle.current.yaw += diffYaw * dampFactor;
    dragAngle.current.yaw = Math.atan2(
      Math.sin(dragAngle.current.yaw),
      Math.cos(dragAngle.current.yaw),
    );
    dragAngle.current.pitch = THREE.MathUtils.lerp(
      dragAngle.current.pitch,
      targetDragAngle.current.pitch,
      dampFactor,
    );
    if (isWormhole) {
      if (Math.abs(dragAngle.current.yaw) < 0.0008) dragAngle.current.yaw = 0;
      if (Math.abs(dragAngle.current.pitch) < 0.0008) dragAngle.current.pitch = 0;
    }

    // Smooth, consistent cinematic easing
    const k = Math.min(1, dt * 1.15);
    let tgtPos = finalPos;
    let tgtLook = finalLook;
    if (phase.current === "via" && viaPos && viaLook) {
      tgtPos = viaPos;
      tgtLook = viaLook;
      if (camera.position.distanceTo(viaPos) < (isWormhole ? 10 : 8)) {
        phase.current = "final";
      }
    }

    // Interpolate camera position
    camera.position.lerp(tgtPos, k);

    // Compute relative look offset: destination lookAt relative to destination camera position
    const tgtLookOffset = tgtLook.clone().sub(tgtPos);
    currentLookOffset.current.lerp(tgtLookOffset, k);

    // Apply right-click drag rotation (yaw around Y, pitch around local X)
    const euler = new THREE.Euler(dragAngle.current.pitch, dragAngle.current.yaw, 0, "YXZ");
    const rotatedLookOffset = currentLookOffset.current.clone().applyEuler(euler);

    // Look at point is ALWAYS in front of the camera, preventing any 180° flips when translating backward
    lookHelper.position.copy(camera.position).add(rotatedLookOffset);
    camera.lookAt(lookHelper.position);
  });

  return null;
}

/* Cosmic starfield that follows the camera position everywhere across the universe */
export function UniversalCosmicStars() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={140} depth={70} count={9500} factor={4.8} fade speed={0.8} />
    </group>
  );
}
