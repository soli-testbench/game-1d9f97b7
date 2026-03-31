export const TILE_SIZE = 1;
export const TILES_PER_FACE = 5;
export const TUNNEL_LENGTH = 40;
export const PLAYER_Z_OFFSET = 4;

export const FACE_COLORS = [
  0x00ccaa, // floor
  0xff0066, // right wall
  0x0044ff, // ceiling
  0xaa00ff, // left wall
];

export const FACE_NAMES = ['floor', 'right', 'ceiling', 'left'] as const;
export type FaceName = (typeof FACE_NAMES)[number];

export const INITIAL_SPEED = 4.7;
export const SPEED_MULTIPLIER = 1.12;
export const SPEED_INTERVAL = 8;

export const JUMP_HEIGHT = 1.8;
export const JUMP_TIME = 0.38;

export const HOLE_DENSITY_START = 0.15;
export const HOLE_DENSITY_MAX = 0.40;
export const HOLE_DENSITY_RAMP = 120; // seconds to reach max

export interface TileRow {
  z: number;
  holes: boolean[][]; // [face][tile] true = hole
}

export enum GameState {
  START,
  PLAYING,
  GAME_OVER,
}
