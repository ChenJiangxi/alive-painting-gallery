import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { safeSrc, type Work } from '../data/works';
import type { Slot } from './positions';

const PAINTING_HEIGHT = 1.4; // 1.4 meters tall, width derived from aspect

type Props = {
  work: Work;
  slot: Slot;
  onSelect: (workIndex: number) => void;
  hoveredIndex: number | null;
  setHovered: (i: number | null) => void;
};

export function Painting({ work, slot, onSelect, hoveredIndex, setHovered }: Props) {
  const staticTex = useLoader(THREE.TextureLoader, safeSrc(work.staticSrc));
  const hasMotion = work.motionSrcs.length > 0;
  const isHovered = hoveredIndex === slot.workIndex;
  const group = useRef<THREE.Group>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);

  // Compute width from aspect when texture loads.
  const [w, h] = useMemo(() => {
    const img = staticTex.image as HTMLImageElement | undefined;
    const aspect = img && img.width && img.height ? img.width / img.height : 0.72;
    return [PAINTING_HEIGHT * aspect, PAINTING_HEIGHT];
  }, [staticTex]);

  // Lazy video texture — created on first hover, then persisted for the
  // lifetime of the painting so subsequent hovers just play() again. The
  // earlier shape destroyed the video in the effect cleanup, which made
  // every hover after the first a no-op.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const texRef = useRef<THREE.VideoTexture | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  // bumped to force re-render so activeTex picks up texRef once it's created
  const [, setTick] = useState(0);

  // Create video lazily on first hover. Once created, it lives until unmount.
  useEffect(() => {
    if (!hasMotion || !isHovered || videoRef.current) return;
    const v = document.createElement('video');
    v.src = safeSrc(work.motionSrcs[0]);
    v.crossOrigin = 'anonymous';
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    const onReady = () => setVideoReady(true);
    v.addEventListener('playing', onReady);
    v.addEventListener('loadeddata', onReady);
    videoRef.current = v;
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    texRef.current = tex;
    v.play().catch(() => { /* autoplay blocked? next hover will retry below */ });
    setTick((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  // Play/pause based on hover state — independent of the create-once effect.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isHovered) {
      v.play().catch(() => { /* still blocked — show static */ });
    } else {
      v.pause();
    }
  }, [isHovered]);

  // Dispose on real unmount only.
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      const tex = texRef.current;
      if (v) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
      if (tex) tex.dispose();
    };
  }, []);

  // Subtle hover lift — painting pushes slightly out from the wall + a soft glow rim.
  useFrame((_, dt) => {
    if (!group.current) return;
    const target = isHovered ? 0.06 : 0;
    const dir = slot.wall === 'left' ? 1 : -1;
    const cur = group.current.position.x;
    const home = slot.position[0];
    const next = THREE.MathUtils.damp(cur, home + dir * target, 6, dt);
    group.current.position.x = next;

    if (frameMat.current) {
      const targetIntensity = isHovered ? 0.35 : 0;
      frameMat.current.emissiveIntensity = THREE.MathUtils.damp(
        frameMat.current.emissiveIntensity,
        targetIntensity,
        4,
        dt,
      );
    }
  });

  // Pick the active texture; only swap to video once it actually has frames.
  const activeTex = isHovered && texRef.current && videoReady ? texRef.current : staticTex;

  // Tiny frame around the painting (subtle warm-brown matte)
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
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = '';
        if (hoveredIndex === slot.workIndex) setHovered(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot.workIndex);
      }}
    >
      {/* picture itself — plane pushed just off the wall */}
      <mesh position={[0, 0, frameDepth + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={activeTex} toneMapped={false} />
      </mesh>

      {/* thin frame: 4 strips around the plane, slightly out from the wall */}
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
