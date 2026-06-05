import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HALL_GEOM, makeSlots } from './positions';
import { works } from '../data/works';

const slots = makeSlots(works.length);

type Props = {
  /** the work index currently zoomed-in on, or null = idle overview */
  focusedIndex: number | null;
  /** how far down the hall the viewer has walked (world Z) */
  walkZ: number;
};

const ENTRANCE_POS = new THREE.Vector3(...HALL_GEOM.entrance);
const ENTRANCE_LOOK = new THREE.Vector3(...HALL_GEOM.entranceLookAt);

/** CameraRig owns the camera. It blends between the idle overview at the
 *  current walked position (with mouse parallax) and a dolly-in pose
 *  facing a specific painting. */
export function CameraRig({ focusedIndex, walkZ }: Props) {
  const { camera, size, pointer } = useThree();
  const targetPos = useRef(new THREE.Vector3().copy(ENTRANCE_POS));
  const targetLook = useRef(new THREE.Vector3().copy(ENTRANCE_LOOK));
  const currentLook = useRef(new THREE.Vector3().copy(ENTRANCE_LOOK));

  // Set initial camera pose on mount.
  useEffect(() => {
    camera.position.copy(ENTRANCE_POS);
    camera.lookAt(ENTRANCE_LOOK);
  }, [camera]);

  useFrame((_, dt) => {
    if (focusedIndex == null) {
      // idle overview pose + parallax based on cursor, offset by walkZ down the hall
      const yawNudge = pointer.x * 0.06;   // ~3.4°
      const pitchNudge = pointer.y * 0.04; // ~2.3°
      targetPos.current.set(
        ENTRANCE_POS.x + pointer.x * 0.18,
        ENTRANCE_POS.y + pointer.y * 0.08,
        ENTRANCE_POS.z + walkZ,
      );
      targetLook.current.set(
        ENTRANCE_LOOK.x + yawNudge * 4,
        ENTRANCE_LOOK.y + pitchNudge * 4,
        ENTRANCE_LOOK.z + walkZ,
      );
    } else {
      // dolly toward the focused painting, hovering 1.6m in front of it
      const slot = slots[focusedIndex];
      const dir = slot.wall === 'left' ? 1 : -1; // step out from the wall into the hall
      const standoff = 1.6;
      targetPos.current.set(
        slot.position[0] + dir * standoff,
        slot.position[1],
        slot.position[2],
      );
      targetLook.current.set(slot.position[0], slot.position[1], slot.position[2]);
    }

    // smooth (frame-rate independent) approach
    camera.position.lerp(targetPos.current, 1 - Math.exp(-dt * 3));
    currentLook.current.lerp(targetLook.current, 1 - Math.exp(-dt * 3));
    camera.lookAt(currentLook.current);
    void size;
  });

  return null;
}
