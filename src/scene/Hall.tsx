import { useMemo } from 'react';
import * as THREE from 'three';
import { works } from '../data/works';
import { Painting } from './Painting';
import { ROTUNDA_GEOM, makeSlots } from './positions';

type Props = {
  hoveredIndex: number | null;
  setHovered: (i: number | null) => void;
  onSelect: (workIndex: number) => void;
};

/**
 * Rotunda: cylindrical room, viewer at center. The cylinder wall is rendered
 * with BackSide so the viewer (inside) actually sees the inner face.
 */
export function Rotunda({ hoveredIndex, setHovered, onSelect }: Props) {
  const slots = useMemo(() => makeSlots(works.length), []);

  const wallColor = '#ece6d9';   // warm cream walls
  const floorColor = '#3a2f25';  // dark walnut
  const ceilColor = '#f4f0e8';   // ceiling slightly brighter

  const r = ROTUNDA_GEOM.wallRadius;
  const h = ROTUNDA_GEOM.wallHeight;

  return (
    <group>
      {/* cylindrical wall (open top + bottom, BackSide so we see the interior) */}
      <mesh position={[0, h / 2, 0]} receiveShadow>
        <cylinderGeometry args={[r, r, h, 64, 1, true]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} side={THREE.BackSide} />
      </mesh>

      {/* floor — circular disk slightly larger than the wall radius */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[ROTUNDA_GEOM.floorRadius, 64]} />
        <meshStandardMaterial color={floorColor} roughness={0.85} />
      </mesh>

      {/* ceiling — dome / disk above */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <circleGeometry args={[ROTUNDA_GEOM.floorRadius, 64]} />
        <meshStandardMaterial color={ceilColor} roughness={1} />
      </mesh>

      {/* lighting */}
      <ambientLight intensity={0.55} color="#f8f1e0" />
      {/* a soft central "skylight" from the ceiling */}
      <pointLight position={[0, h - 0.4, 0]} intensity={1.1} color="#fff1d2" distance={r * 2.4} decay={1.3} />
      {/* gentle rim fill from above and forward */}
      <directionalLight position={[0, h * 1.4, r * 0.8]} intensity={0.4} color="#fff0d0" />

      {/* paintings */}
      {slots.map((slot) => (
        <Painting
          key={slot.workIndex}
          work={works[slot.workIndex]}
          slot={slot}
          onSelect={onSelect}
          hoveredIndex={hoveredIndex}
          setHovered={setHovered}
        />
      ))}
    </group>
  );
}
