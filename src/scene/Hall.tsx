import { useMemo } from 'react';
import { works } from '../data/works';
import { Painting } from './Painting';
import { HALL_GEOM, makeSlots } from './positions';

type Props = {
  hoveredIndex: number | null;
  setHovered: (i: number | null) => void;
  onSelect: (workIndex: number) => void;
  /** click on the hallway floor → walk to that Z */
  onWalkTo: (worldZ: number) => void;
};

export function Hall({ hoveredIndex, setHovered, onSelect, onWalkTo }: Props) {
  const slots = useMemo(() => makeSlots(works.length), []);

  const wallColor = '#ece6d9';  // warm cream walls
  const floorColor = '#3a2f25'; // dark walnut floor
  const ceilColor = '#f4f0e8';  // ceiling slightly brighter

  const halfLen = HALL_GEOM.length / 2;
  const halfWid = HALL_GEOM.width / 2;
  // shift so the camera at -8 is just inside the entrance
  const centerZ = halfLen - 8;

  return (
    <group position={[0, 0, centerZ]}>
      {/* floor — click to walk to that spot */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          // pointer cursor is set up in Painting's hover; here the floor click
          // is the primary "walk forward" gesture, so signal it back to App.
          onWalkTo(e.point.z);
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      >
        <planeGeometry args={[HALL_GEOM.width, HALL_GEOM.length]} />
        <meshStandardMaterial color={floorColor} roughness={0.85} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL_GEOM.height, 0]}>
        <planeGeometry args={[HALL_GEOM.width, HALL_GEOM.length]} />
        <meshStandardMaterial color={ceilColor} roughness={1} />
      </mesh>
      {/* left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-halfWid, HALL_GEOM.height / 2, 0]} receiveShadow>
        <planeGeometry args={[HALL_GEOM.length, HALL_GEOM.height]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>
      {/* right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[halfWid, HALL_GEOM.height / 2, 0]} receiveShadow>
        <planeGeometry args={[HALL_GEOM.length, HALL_GEOM.height]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>
      {/* far wall — closes the perspective */}
      <mesh position={[0, HALL_GEOM.height / 2, halfLen]}>
        <planeGeometry args={[HALL_GEOM.width, HALL_GEOM.height]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>
      {/* near wall (behind camera) — so a glance back doesn't reveal void */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, HALL_GEOM.height / 2, -halfLen]}>
        <planeGeometry args={[HALL_GEOM.width, HALL_GEOM.height]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>

      {/* lighting */}
      <ambientLight intensity={0.5} color="#f8f1e0" />
      {/* warm key light from above hallway */}
      <directionalLight position={[0, 8, -6]} intensity={1.0} color="#fff1d2" />
      {/* gentle fill from the far end */}
      <pointLight position={[0, 3, halfLen - 2]} intensity={0.6} color="#fde7be" distance={20} decay={1.3} />
      {/* near pool of light at the entrance */}
      <pointLight position={[0, 3, -halfLen + 2]} intensity={0.4} color="#fff1d2" distance={14} decay={1.5} />

      {/* paintings — moved out of the centered group so their world coordinates are absolute */}
      <group position={[0, 0, -centerZ]}>
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
    </group>
  );
}
