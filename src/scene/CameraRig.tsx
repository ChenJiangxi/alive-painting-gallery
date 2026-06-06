import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ROTUNDA_GEOM, makeSlots } from './positions';
import { works } from '../data/works';
import { interactionState } from './interactionState';

const slots = makeSlots(works.length);

type Props = {
  /** the work index currently zoomed-in on, or null = rotunda overview */
  focusedIndex: number | null;
};

const CENTER = new THREE.Vector3(0, ROTUNDA_GEOM.eyeHeight, 0);
/** auto-rotate angular speed at rest, in rad/sec (~180s per full revolution) */
const AUTO_ROTATE_RPS = (Math.PI * 2) / 180;
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

  // Drag handlers on the canvas DOM element. A small movement threshold lets
  // us distinguish "user clicked" from "user grabbed to rotate" — without it,
  // every click would briefly engage drag and suppress its own hover.
  useEffect(() => {
    const el = gl.domElement;
    const DRAG_THRESHOLD_PX = 4;
    let downX = 0;
    let downY = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = false; // confirmed only after crossing threshold
      downX = e.clientX;
      downY = e.clientY;
      lastDragX.current = e.clientX;
      dragYawDelta.current = 0;
      el.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) {
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        dragging.current = true;
        interactionState.dragging = true;
        document.body.style.cursor = 'grabbing';
      }
      const moveDx = e.clientX - lastDragX.current;
      lastDragX.current = e.clientX;
      dragYawDelta.current += -moveDx * DRAG_YAW_PER_PX;
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      interactionState.dragging = false;
      if (document.body.style.cursor === 'grabbing') document.body.style.cursor = '';
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

    // Pose B (focused): stand back far enough that the caption strip at the
    // bottom doesn't overlap the painting. Sit slightly above the painting
    // center so the painting reads in the upper 60% of the viewport.
    let posB = posA;
    let lookB = lookA;
    if (focusedIndex != null) {
      const slot = slots[focusedIndex];
      const standoff = 2.6;
      const r = Math.hypot(slot.position[0], slot.position[2]);
      const ix = -slot.position[0] / r;
      const iz = -slot.position[2] / r;
      posB = new THREE.Vector3(
        slot.position[0] + ix * standoff,
        slot.position[1] + 0.15,
        slot.position[2] + iz * standoff,
      );
      lookB = new THREE.Vector3(slot.position[0], slot.position[1] + 0.18, slot.position[2]);
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
