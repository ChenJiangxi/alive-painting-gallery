import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { safeSrc, type Work } from '../data/works';
import type { Slot } from './positions';

const PAINTING_HEIGHT = 1.4; // 1.4 m tall, width from aspect

type Props = {
  work: Work;
  slot: Slot;
  onSelect: (workIndex: number) => void;
  hoveredIndex: number | null;
  setHovered: (i: number | null) => void;
};

/**
 * One painting on the rotunda wall.
 *
 * Texture pipeline:
 *  - The still image always loads (via useTexture).
 *  - If the work has motion, a VideoTexture is created eagerly via
 *    @react-three/drei's useVideoTexture and is already playing in the
 *    background (muted, looped). Hovering simply swaps which texture is
 *    bound to the painting's material — no create/destroy, no race.
 */
export function Painting(props: Props) {
  const { work } = props;
  if (work.motionSrcs.length > 0) {
    return <PaintingWithMotion {...props} />;
  }
  return <PaintingStill {...props} />;
}

function PaintingStill({ work, slot, onSelect, hoveredIndex, setHovered }: Props) {
  const staticTex = useTexture(safeSrc(work.staticSrc));
  return (
    <Frame
      tex={staticTex}
      work={work}
      slot={slot}
      onSelect={onSelect}
      hoveredIndex={hoveredIndex}
      setHovered={setHovered}
      forceStill
    />
  );
}

function PaintingWithMotion({ work, slot, onSelect, hoveredIndex, setHovered }: Props) {
  const staticTex = useTexture(safeSrc(work.staticSrc));
  const videoTex = useVideoTexture(safeSrc(work.motionSrcs[0]), {
    muted: true,
    loop: true,
    start: true,
    playsInline: true,
    crossOrigin: 'anonymous',
  }) as THREE.VideoTexture;

  const isHovered = hoveredIndex === slot.workIndex;
  return (
    <Frame
      tex={isHovered ? videoTex : staticTex}
      work={work}
      slot={slot}
      onSelect={onSelect}
      hoveredIndex={hoveredIndex}
      setHovered={setHovered}
    />
  );
}

type FrameProps = Props & {
  tex: THREE.Texture;
  forceStill?: boolean;
};

function Frame({
  tex,
  slot,
  onSelect,
  hoveredIndex,
  setHovered,
  forceStill = false,
}: FrameProps) {
  const isHovered = hoveredIndex === slot.workIndex;
  const group = useRef<THREE.Group>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);

  // Width from texture aspect (falls back until image is decoded).
  const [w, h] = useMemo(() => {
    const img = (tex.image as HTMLImageElement | HTMLVideoElement | undefined) || undefined;
    const iw = img ? ('videoWidth' in img ? img.videoWidth : img.width) : 0;
    const ih = img ? ('videoHeight' in img ? img.videoHeight : img.height) : 0;
    const aspect = iw && ih ? iw / ih : 0.72;
    return [PAINTING_HEIGHT * aspect, PAINTING_HEIGHT];
  }, [tex]);

  // Subtle hover lift + warm glow on the frame.
  useFrame((_, dt) => {
    if (!group.current) return;
    const target = isHovered && !forceStill ? 0.05 : 0;
    // The inward normal at this slot points from position toward origin.
    // Multiply by -1 to nudge outward (away from origin); inward looks weird.
    // Actually we want to push the painting INTO the room a bit on hover,
    // which means from the wall toward the origin → -position / r * target.
    const inwardX = -slot.position[0] / Math.hypot(slot.position[0], slot.position[2]);
    const inwardZ = -slot.position[2] / Math.hypot(slot.position[0], slot.position[2]);
    const homeX = slot.position[0];
    const homeZ = slot.position[2];
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      homeX + inwardX * target,
      6,
      dt,
    );
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      homeZ + inwardZ * target,
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
      {/* painting plane */}
      <mesh position={[0, 0, frameDepth + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} toneMapped={false} />
      </mesh>

      {/* frame strips — top / bottom / left / right */}
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
