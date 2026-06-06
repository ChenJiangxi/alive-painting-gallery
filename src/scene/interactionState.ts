/**
 * Cross-cutting interaction state that doesn't fit cleanly into React state.
 *
 * Why a module-level ref instead of context: CameraRig owns the drag detection
 * via raw DOM pointer events on the canvas element, while each Painting reads
 * the drag state inside its own R3F onPointerOver handler — wiring this through
 * React state would force a re-render of every painting on every drag start /
 * end, and the value only matters as a synchronous check at the moment of the
 * event.
 */

export const interactionState = {
  /** true while the viewer is mid-drag on the canvas */
  dragging: false,
};
