import * as THREE from 'three';

// Tunnel dimensions
export const TILE_SIZE = 1;
export const TILES_WIDE = 5;
export const TUNNEL_WIDTH = TILES_WIDE * TILE_SIZE;
export const TUNNEL_HEIGHT = TILES_WIDE * TILE_SIZE; // square cross-section
export const TILE_GAP = 0.03;
export const VISIBLE_ROWS = 40;

// Player
export const PLAYER_RADIUS = 0.3;
export const PLAYER_COLOR = 0x00ffff;
export const JUMP_HEIGHT = 1.8;
export const JUMP_HALF_TIME = 0.19; // 380ms total air time

// Speed
export const INITIAL_SPEED = 4.7; // tiles per second
export const SPEED_INCREASE = 0.12; // 12%
export const SPEED_INTERVAL = 8; // seconds

// Physics
export const MAX_DT = 0.05; // 50ms cap

// Face indices (circular order: floor -> right -> ceiling -> left)
export const FACE_FLOOR = 0;
export const FACE_RIGHT = 1;
export const FACE_CEILING = 2;
export const FACE_LEFT = 3;

export const FACE_COLORS: number[] = [
  0x00ccaa, // floor - teal
  0xff0066, // right - hot pink
  0x0044ff, // ceiling - deep blue
  0xaa00ff, // left - electric purple
];

export const FACE_COUNT = 4;

// Camera
export const CAMERA_FOV = 75;
export const CAMERA_LERP_DURATION = 0.2; // 200ms

export type GamePhase = 'menu' | 'playing' | 'gameover';

export interface TileRow {
  holes: boolean[][]; // holes[face][lane] — true = hole, false = solid
  z: number; // world z position
}

// Face geometry helpers
export function getFaceNormal(face: number): THREE.Vector3 {
  switch (face) {
    case FACE_FLOOR: return new THREE.Vector3(0, 1, 0);
    case FACE_CEILING: return new THREE.Vector3(0, -1, 0);
    case FACE_LEFT: return new THREE.Vector3(1, 0, 0);
    case FACE_RIGHT: return new THREE.Vector3(-1, 0, 0);
    default: return new THREE.Vector3(0, 1, 0);
  }
}

// Get tile world position for a given face, lateral index, and z
export function getTilePosition(face: number, laneIndex: number, z: number): THREE.Vector3 {
  const offset = laneIndex * TILE_SIZE + TILE_SIZE / 2;
  switch (face) {
    case FACE_FLOOR:
      return new THREE.Vector3(offset, 0, z);
    case FACE_CEILING:
      return new THREE.Vector3(TUNNEL_WIDTH - offset, TUNNEL_HEIGHT, z);
    case FACE_LEFT:
      return new THREE.Vector3(0, offset, z);
    case FACE_RIGHT:
      return new THREE.Vector3(TUNNEL_WIDTH, TUNNEL_HEIGHT - offset, z);
    default:
      return new THREE.Vector3(offset, 0, z);
  }
}

// Get tile rotation for a given face
export function getTileRotation(face: number): THREE.Euler {
  switch (face) {
    case FACE_FLOOR:
      return new THREE.Euler(-Math.PI / 2, 0, 0);
    case FACE_CEILING:
      return new THREE.Euler(Math.PI / 2, 0, 0);
    case FACE_LEFT:
      return new THREE.Euler(0, Math.PI / 2, 0);
    case FACE_RIGHT:
      return new THREE.Euler(0, -Math.PI / 2, 0);
    default:
      return new THREE.Euler(-Math.PI / 2, 0, 0);
  }
}

// Adjacent face when moving off an edge
// Returns [newFace, newLaneIndex]
export function getAdjacentFace(face: number, laneIndex: number, direction: -1 | 1): [number, number] {
  // direction: -1 = left, 1 = right (relative to face orientation)
  if (direction === -1 && laneIndex > 0) return [face, laneIndex - 1];
  if (direction === 1 && laneIndex < TILES_WIDE - 1) return [face, laneIndex + 1];

  // Wrapping: circular order is floor(0) -> right(1) -> ceiling(2) -> left(3)
  if (direction === 1 && laneIndex === TILES_WIDE - 1) {
    const nextFace = (face + 1) % FACE_COUNT;
    return [nextFace, 0];
  }
  if (direction === -1 && laneIndex === 0) {
    const prevFace = (face + FACE_COUNT - 1) % FACE_COUNT;
    return [prevFace, TILES_WIDE - 1];
  }

  return [face, laneIndex];
}

// Get the player's world position on a face
export function getPlayerWorldPosition(face: number, laneIndex: number, z: number, heightOffset: number): THREE.Vector3 {
  const lateralPos = laneIndex * TILE_SIZE + TILE_SIZE / 2;
  switch (face) {
    case FACE_FLOOR:
      return new THREE.Vector3(lateralPos, PLAYER_RADIUS + heightOffset, z);
    case FACE_CEILING:
      return new THREE.Vector3(TUNNEL_WIDTH - lateralPos, TUNNEL_HEIGHT - PLAYER_RADIUS - heightOffset, z);
    case FACE_LEFT:
      return new THREE.Vector3(PLAYER_RADIUS + heightOffset, lateralPos, z);
    case FACE_RIGHT:
      return new THREE.Vector3(TUNNEL_WIDTH - PLAYER_RADIUS - heightOffset, TUNNEL_HEIGHT - lateralPos, z);
    default:
      return new THREE.Vector3(lateralPos, PLAYER_RADIUS + heightOffset, z);
  }
}

// Camera rotation angle for each face (rotation around Z axis)
export function getFaceAngle(face: number): number {
  return face * (Math.PI / 2);
}
