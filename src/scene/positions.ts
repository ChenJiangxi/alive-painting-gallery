/**
 * Painting placement in the hallway.
 *
 * Coordinate frame:
 *   +X = right wall · -X = left wall
 *   +Y = up
 *   +Z = forward into the hallway (away from the entrance camera)
 *
 * The camera starts at roughly (0, 1.6, -8) looking toward +Z. Paintings line
 * the two side walls, eye-height centered. Order matches works[] so the first
 * works (motion ones) sit nearest to the entrance.
 */

export type Slot = {
  /** index into the works[] array */
  workIndex: number;
  /** world position of the painting's center */
  position: [number, number, number];
  /** rotation around Y in radians — paintings face into the hallway */
  rotationY: number;
  /** which wall it lives on (for grouping / debugging) */
  wall: 'left' | 'right';
};

const HALL_WIDTH = 6;      // x: -3 .. +3
const WALL_X = HALL_WIDTH / 2;
const PAINTING_Y = 1.7;
const SPACING_Z = 3.2;
const START_Z = -4;        // first painting is this many units in front of camera
const Y_JITTER = 0.18;     // small vertical offset variety so it's not a perfect line

/** Build slots: alternate left / right, walking from the entrance forward. */
export function makeSlots(count: number): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const isLeft = i % 2 === 0;
    const row = Math.floor(i / 2);
    const z = START_Z + row * SPACING_Z;
    // tiny vertical jitter, deterministic from i so re-renders stay stable
    const jitter = (((i * 9301 + 49297) % 233280) / 233280 - 0.5) * 2 * Y_JITTER;
    slots.push({
      workIndex: i,
      position: [isLeft ? -WALL_X + 0.05 : WALL_X - 0.05, PAINTING_Y + jitter, z],
      rotationY: isLeft ? Math.PI / 2 : -Math.PI / 2,
      wall: isLeft ? 'left' : 'right',
    });
  }
  return slots;
}

export const HALL_GEOM = {
  width: HALL_WIDTH,
  length: 26,   // overall hall depth
  height: 4.2,
  /** camera entrance position */
  entrance: [0, 1.6, -8] as [number, number, number],
  /** what the entrance camera looks toward */
  entranceLookAt: [0, 1.6, 6] as [number, number, number],
};
