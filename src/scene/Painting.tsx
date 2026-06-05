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
  if (work.motionSrc) {
    return <PaintingWithMotion {...props} />;
  }
  return <PaintingStill {...props} />;
}

function PaintingStill(props: Props) {
  const staticTex = useTexture(safeSrc(props.work.staticSrc));
  return <Frame tex={staticTex} {...props} />;
}

/**
 * Motion painting — manually managed video element so we control:
 *  - same-origin (no crossOrigin, so WebGL never taints the texture),
 *  - DOM-attached (some browsers refuse to decode detached videos),
 *  - lazy creation on first hover (10 videos × ~4 MB would blow first paint),
 *  - persistent across hovers (don't tear down on leave; just pause).
 *
 * Plane dimensions are ALWAYS derived from the still image, so the painting
 * occupies its "original" size on the wall. The video plays into the same
 * plane on hover and may be slightly stretched if its aspect differs.
 */
function PaintingWithMotion(props: Props) {
  const { work, slot, hoveredIndex } = props;
  const staticTex = useTexture(safeSrc(work.staticSrc));
  const [videoTex, setVideoTex] = useState<THREE.VideoTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isHovered = hoveredIndex === slot.workIndex;

  // Initialize video on FIRST hover; persist for the component's lifetime.
  useEffect(() => {
    if (!isHovered || videoRef.current) return;
    const v = document.createElement('video');
    v.src = safeSrc(work.motionSrc!);
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(v);
    videoRef.current = v;
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // CSS object-fit:cover equivalent. The plane is sized for the static
    // image; if the video has a different aspect, crop it (don't stretch).
    // Compute on metadata load, since videoWidth/Height aren't available
    // until then.
    const fitCover = () => {
      const sImg = staticTex.image as HTMLImageElement | undefined;
      const sw = sImg?.width ?? 0;
      const sh = sImg?.height ?? 0;
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (!sw || !sh || !vw || !vh) return;
      const sa = sw / sh;
      const va = vw / vh;
      if (va < sa) {
        // video is taller than plane — crop top + bottom
        tex.repeat.set(1, va / sa);
        tex.offset.set(0, (1 - va / sa) / 2);
      } else if (va > sa) {
        // video is wider than plane — crop sides
        tex.repeat.set(sa / va, 1);
        tex.offset.set((1 - sa / va) / 2, 0);
      } else {
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);
      }
    };
    if (v.videoWidth) fitCover();
    else v.addEventListener('loadedmetadata', fitCover);

    setVideoTex(tex);
    v.play().catch(() => { /* will retry on next hover */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  // Play/pause based on hover; do not destroy.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isHovered) v.play().catch(() => { /* still blocked */ });
    else v.pause();
  }, [isHovered]);

  // One-shot dispose on unmount.
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.remove();
      }
      if (videoTex) videoTex.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tex = isHovered && videoTex ? videoTex : staticTex;
  return (
    <Frame
      tex={tex}
      sizingTex={staticTex}
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

type FrameProps = Props & {
  tex: THREE.Texture;
  sizingTex?: THREE.Texture;
  onGestureEnter?: () => void;
  onGestureLeave?: () => void;
};

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

  // Plane geometry is locked to the still image's aspect, fitted inside the
  // bounding box. Whichever dimension hits its cap first becomes the limiting
  // factor; the other shrinks to preserve aspect — never cropped, never
  // stretched. The video, when bound, is rendered in the same plane.
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
