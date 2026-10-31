import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect } from "react";

export function FreeRoam({ enabled, speed = 6 }: { enabled: boolean; speed?: number }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled) {
      initialized.current = false;
      keys.current = {};
      return;
    }
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    yaw.current = e.y;
    pitch.current = e.x;
    initialized.current = true;

    const el = gl.domElement;
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    const onClick = () => {
      if (document.pointerLockElement !== el) el.requestPointerLock?.();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      yaw.current -= e.movementX * 0.0025;
      pitch.current -= e.movementY * 0.0025;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    el.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", onMouseMove);
      if (document.pointerLockElement === el) document.exitPointerLock?.();
    };
  }, [enabled, camera, gl]);

  useFrame((_, dt) => {
    if (!enabled || !initialized.current) return;
    const k = keys.current;
    const boost = k["ShiftLeft"] || k["ShiftRight"] ? 3 : 1;
    const v = speed * boost * dt;
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(euler);

    if (k["KeyW"] || k["ArrowUp"]) camera.position.addScaledVector(forward, v);
    if (k["KeyS"] || k["ArrowDown"]) camera.position.addScaledVector(forward, -v);
    if (k["KeyD"] || k["ArrowRight"]) camera.position.addScaledVector(right, v);
    if (k["KeyA"] || k["ArrowLeft"]) camera.position.addScaledVector(right, -v);
    if (k["Space"]) camera.position.y += v;
    if (k["ControlLeft"] || k["ControlRight"]) camera.position.y -= v;
  });

  return null;
}
