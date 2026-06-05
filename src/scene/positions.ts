/**
 * Painting placement on a circular rotunda wall.
 *
 * The viewer stands at the origin; paintings line a cylindrical wall at
 * radius `WALL_RADIUS`, eye-height centered. Each painting faces the
 * center of the room (its plane normal points inward toward origin).
 */

export type Slot = {
  /** index into the works[] array */
  workIndex: number;
  /** world position of the painting's center */
  position: [number, number, number];
  /** rotation around Y so the painting's front face points to the origin */
  rotationY: number;
  /** angle around the rotunda (radians, 0 = straight ahead +Z, increases CCW) */
  angle: number;
};

const WALL_RADIUS = 5.2;
const PAINTING_Y = 1.7;
const Y_JITTER = 0.18;

/** Build slots equally spaced around the circle, starting at +Z (in front
 *  of the viewer's initial gaze) and going clockwise as i increases. */
export function makeSlots(count: number): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.sin(angle) * WALL_RADIUS;
    const z = Math.cos(angle) * WALL_RADIUS;

    // Default plane normal is +Z. Rotating by angle around Y sends +Z to
    // (sin angle, 0, cos angle), which is the OUTWARD direction at that
    // wall position. We want the INWARD direction (back toward origin),
    // so add π.
    const rotationY = angle + Math.PI;

    // Deterministic tiny vertical offset so the line of paintings isn't
    // a perfectly even crown.
    const jitter = (((i * 9301 + 49297) % 233280) / 233280 - 0.5) * 2 * Y_JITTER;

    slots.push({
      workIndex: i,
      position: [x, PAINTING_Y + jitter, z],
      rotationY,
      angle,
    });
  }
  return slots;
}

export const ROTUNDA_GEOM = {
  wallRadius: WALL_RADIUS,
  wallHeight: 4.4,
  floorRadius: WALL_RADIUS + 0.3,    // floor extends slightly beyond wall base
  eyeHeight: 1.6,
};
