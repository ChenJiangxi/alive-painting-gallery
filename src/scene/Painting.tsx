import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { safeSrc, type Work } from '../data/works';
import type { Slot } from './positions';

/** Bounding box on the wall — paintings scale to fit inside this without
 *  cropping. Tall paintings hit MAX_H first; wide ones hit MAX_W first. */
const MAX_H = 1.55;
const MAX_W = 1.8;

type Props = {
  work: Work;
  slot: Slot;
  onSelect: (workIndex: number) => void;
  hoveredIndex: number | null;
  setHovered: (i: number | null) => void;
};

export function Painting(props: Props) {
  const { work } = props;
  if (work.motionSrcs.length > 0) {
    return <PaintingWithMotion {...props} />;
  }
  return <PaintingStill {...props} />;
}

function PaintingStill(props: Props) {
  const staticTex = useTexture(safeSrc(props.work.staticSrc));
  return <Frame tex={staticTex} {...props} />;
}

type FrameProps = Props & {
  tex: THREE.Texture;
  /** synchronous gesture-context callbacks for things like un/muting media */
  onGestureEnter?: () => void;
  onGestureLeave?: () => void;
  /** if set, lock plane geometry to this image regardless of which tex is
   *  currently bound. Prevents the plane from resizing when video swaps in. */
  sizingTex?: THREE.Texture;
};

/**
 * Motion painting — manually managed video element so we control:
 *  - same-origin (no crossOrigin, so WebGL never taints the texture),
 *  - DOM-attached (some browsers refuse to decode detached videos),
 *  - eager preload + muted autoplay so the first frame is always ready,
 *  - hover unmutes (the hover event is a valid user gesture), leave mutes.
 */
function PaintingWithMotion(props: Props) {
  const { work, slot, hoveredIndex } = props;
  const staticTex = useTexture(safeSrc(work.staticSrc));
  const [videoTex, setVideoTex] = useState<THREE.VideoTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isHovered = hoveredIndex === slot.workIndex;

  useEffect(() => {
    const v = document.createElement('video');
    v.src = safeSrc(work.motionSrcs[0]);
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    // hide off-screen but keep in DOM so the browser actually decodes frames
    v.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(v);
    videoRef.current = v;
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    setVideoTex(tex);
    v.play().catch(() => { /* will retry on hover */ });
    return () => {
      v.pause();
      v.remove();
      tex.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hover ensures playback (in case autoplay was blocked at mount).
  // We intentionally do NOT unmute here — unmuting in a reactive effect is
  // not a "user activation" so browsers will pause the video. Unmute is
  // handled in onPointerOver directly inside Frame's gesture context below.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isHovered) v.play().catch(() => { /* still blocked */ });
  }, [isHovered]);

  const tex = isHovered && videoTex ? videoTex : staticTex;
  // Lock the plane to the VIDEO's aspect when one is available — that's
  // what the user considers "the original size". The static is shown at
  // the same plane and may be slightly stretched, but the painting never
  // jumps size when hovered.
  return (
    <Frame
      tex={tex}
      sizingTex={videoTex ?? staticTex}
      onGestureEnter={() => {
        const v = videoRef.current;
        if (v) {
          v.muted = false;
          v.play().catch(() => { /* will retry on next gesture */ });
        }
      }}
      onGestureLeave={() => {
        const v = videoRef.current;
        if (v) v.muted = true;
      }}
      {...props}
    />
  );
}

function Frame({
  tex,
  sizingTex,
  slot,
  onSelect,
  hoveredIndex,
  setHovered,
  onGestureEnter,
  onGestureLeave,
}: FrameProps) {
  const isHovered = hoveredIndex === slot.workIndex;
  const group = useRef<THREE.Group>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);

  // Compute width × height that fits MAX_W × MAX_H without cropping or
  // distorting the painting. The sizing texture is locked to the "canonical"
  // image of the painting (video for motion works, static for stills) so the
  // plane size never changes when the bound texture swaps on hover.
  const sourceTex = sizingTex ?? tex;
  const [w, h] = useMemo(() => {
    const img = (sourceTex.image as HTMLImageElement | HTMLVideoElement | undefined) || undefined;
    const iw = img ? ('videoWidth' in img ? img.videoWidth : img.width) : 0;
    const ih = img ? ('videoHeight' in img ? img.videoHeight : img.height) : 0;
    const aspect = iw && ih ? iw / ih : 0.72;
    let height = MAX_H;
    let width = height * aspect;
    if (width > MAX_W) {
      width = MAX_W;
      height = width / aspect;
    }
    return [width, height];
  }, [sourceTex]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const target = isHovered ? 0.05 : 0;
    const inwardX = -slot.position[0] / Math.hypot(slot.position[0], slot.position[2]);
    const inwardZ = -slot.position[2] / Math.hypot(slot.position[0], slot.position[2]);
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      slot.position[0] + inwardX * target,
      6,
      dt,
    );
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      slot.position[2] + inwardZ * target,
      6,
      dt,
    );

    if (frameMat.current) {
      const intensity = isHovered ? 0.32 : 0;
      frameMat.current.emissiveIntensity = THREE.MathUtils.damp(
        frameMat.current.emissiveIntensity,
        intensity,
        4,
        dt,
      );
    }
  });

  const frameThickness = 0.015;
  const frameDepth = 0.02;

  return (
    <group
      ref={group}
      position={slot.position}
      rotation={[0, slot.rotationY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        setHovered(slot.workIndex);
        onGestureEnter?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = '';
        if (hoveredIndex === slot.workIndex) setHovered(null);
        onGestureLeave?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot.workIndex);
      }}
    >
      <mesh position={[0, 0, frameDepth + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} toneMapped={false} />
      </mesh>

      <mesh position={[0, h / 2 + frameThickness / 2, frameDepth / 2]}>
        <boxGeometry args={[w + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial
          ref={frameMat}
          color="#211c16"
          emissive="#d9a86a"
          emissiveIntensity={0}
          roughness={0.7}
        />
      </mesh>
      <mesh position={[0, -h / 2 - frameThickness / 2, frameDepth / 2]}>
        <boxGeometry args={[w + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#211c16" emissive="#d9a86a" emissiveIntensity={0} roughness={0.7} />
      </mesh>
      <mesh position={[-w / 2 - frameThickness / 2, 0, frameDepth / 2]}>
        <boxGeometry args={[frameThickness, h, frameDepth]} />
        <meshStandardMaterial color="#211c16" emissive="#d9a86a" emissiveIntensity={0} roughness={0.7} />
      </mesh>
      <mesh position={[w / 2 + frameThickness / 2, 0, frameDepth / 2]}>
        <boxGeometry args={[frameThickness, h, frameDepth]} />
        <meshStandardMaterial color="#211c16" emissive="#d9a86a" emissiveIntensity={0} roughness={0.7} />
      </mesh>
    </group>
  );
}
