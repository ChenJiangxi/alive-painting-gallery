import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { safeSrc, type Work } from '../data/works';
import type { Slot } from './positions';

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
  return <Frame tex={staticTex} sizingTex={staticTex} {...props} />;
}

/**
 * Motion painting — the painting on the wall is the still at its original
 * size. On hover the texture swaps to the video (rendered into the same
 * plane). The plane never changes shape; the still defines the size for
 * good.
 */
function PaintingWithMotion(props: Props) {
  const { work, slot, hoveredIndex } = props;
  const staticTex = useTexture(safeSrc(work.staticSrc));
  const [videoTex, setVideoTex] = useState<THREE.VideoTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isHovered = hoveredIndex === slot.workIndex;

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
    setVideoTex(tex);
    v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isHovered) v.play().catch(() => {});
    else v.pause();
  }, [isHovered]);

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
          v.play().catch(() => {});
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
  /** Plane geometry is sized from this texture (always the still) so the
   *  plane never resizes when the active texture swaps to video on hover. */
  sizingTex: THREE.Texture;
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

  const [w, h] = useMemo(() => {
    const img = sizingTex.image as HTMLImageElement | undefined;
    const iw = img?.width ?? 0;
    const ih = img?.height ?? 0;
    const aspect = iw && ih ? iw / ih : 0.72;
    let height = MAX_H;
    let width = height * aspect;
    if (width > MAX_W) {
      width = MAX_W;
      height = width / aspect;
    }
    return [width, height];
  }, [sizingTex]);

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
