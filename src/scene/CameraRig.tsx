import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ROTUNDA_GEOM, makeSlots } from './positions';
import { works } from '../data/works';

const slots = makeSlots(works.length);

type Props = {
  /** the work index currently zoomed-in on, or null = rotunda overview */
  focusedIndex: number | null;
};

const CENTER = new THREE.Vector3(0, ROTUNDA_GEOM.eyeHeight, 0);
/** auto-rotate angular speed at rest, in rad/sec (~90s per full revolution) */
const AUTO_ROTATE_RPS = (Math.PI * 2) / 90;
/** how much yaw the user can scrub by dragging across the whole canvas */
const DRAG_YAW_PER_PX = 0.0055;

/** CameraRig: viewer stays at the rotunda's center, yaw is auto-rotating with
 *  drag-to-rotate override. When a painting is focused, the camera lerps to
 *  hover ~1.4m off the wall facing that painting. */
export function CameraRig({ focusedIndex }: Props) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const focusBlend = useRef(0); // 0 = center pose, 1 = focused pose
  const focusPos = useRef(new THREE.Vector3().copy(CENTER));
  const focusLook = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3().copy(CENTER));
  const currentLook = useRef(new THREE.Vector3());

  // drag-to-rotate state
  const dragging = useRef(false);
  const lastDragX = useRef(0);
  const dragYawDelta = useRef(0);

  // Initial camera pose: at center, looking forward (+Z)
  useEffect(() => {
    camera.position.copy(CENTER);
    camera.lookAt(new THREE.Vector3(0, ROTUNDA_GEOM.eyeHeight, 1));
  }, [camera]);

  // Drag handlers on the canvas DOM element.
  useEffect(() => {
    const el = gl.domElement;
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      lastDragX.current = e.clientX;
      dragYawDelta.current = 0;
      el.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastDragX.current;
      lastDragX.current = e.clientX;
      dragYawDelta.current += -dx * DRAG_YAW_PER_PX;
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      el.releasePointerCapture?.(e.pointerId);
    };
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    // Update yaw: auto-rotate when not focused, plus any drag delta the user has
    // accumulated this frame. Don't auto-rotate while a painting is focused.
    if (focusedIndex == null) {
      yaw.current += AUTO_ROTATE_RPS * dt;
    }
    yaw.current += dragYawDelta.current;
    dragYawDelta.current = 0;

    // Pose A (center): camera at origin, looking along yaw direction.
    const lookOffsetA = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current)).multiplyScalar(4);
    const lookA = new THREE.Vector3().copy(CENTER).add(lookOffsetA);
    const posA = new THREE.Vector3().copy(CENTER);

    // Pose B (focused): hover near the painting on the wall, looking at the painting.
    let posB = posA;
    let lookB = lookA;
    if (focusedIndex != null) {
      const slot = slots[focusedIndex];
      const standoff = 1.4;
      // inward direction at this slot
      const r = Math.hypot(slot.position[0], slot.position[2]);
      const ix = -slot.position[0] / r;
      const iz = -slot.position[2] / r;
      posB = new THREE.Vector3(
        slot.position[0] + ix * standoff,
        slot.position[1],
        slot.position[2] + iz * standoff,
      );
      lookB = new THREE.Vector3(slot.position[0], slot.position[1], slot.position[2]);
    }

    // Blend factor toward 1 when focused, toward 0 otherwise.
    const blendTarget = focusedIndex == null ? 0 : 1;
    focusBlend.current = THREE.MathUtils.damp(focusBlend.current, blendTarget, 3, dt);

    focusPos.current.lerpVectors(posA, posB, focusBlend.current);
    focusLook.current.lerpVectors(lookA, lookB, focusBlend.current);

    // Smooth final approach
    currentPos.current.lerp(focusPos.current, 1 - Math.exp(-dt * 5));
    currentLook.current.lerp(focusLook.current, 1 - Math.exp(-dt * 5));

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLook.current);
  });

  return null;
}
