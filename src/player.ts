import * as THREE from 'three';
import { TILE_SIZE, TILES_PER_FACE, JUMP_HEIGHT, JUMP_TIME } from './types';

export class Player {
  face = 0; // 0=floor, 1=right, 2=ceiling, 3=left
  tile = 2; // lateral position (0-4)
  mesh: THREE.Mesh;

  jumping = false;
  jumpVelocity = 0;
  jumpOffset = 0; // height above the face surface
  private gravity: number;
  private jumpV0: number;

  constructor(scene: THREE.Scene) {
    const geom = new THREE.SphereGeometry(0.3, 24, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x00ffff,
      emissiveIntensity: 2.5,
    });
    this.mesh = new THREE.Mesh(geom, mat);
    scene.add(this.mesh);

    // Parabolic jump: v0 = 2*h/t_half, g = 2*h/t_half^2
    const halfTime = JUMP_TIME / 2;
    this.jumpV0 = (2 * JUMP_HEIGHT) / halfTime;
    this.gravity = (2 * JUMP_HEIGHT) / (halfTime * halfTime);
  }

  jump() {
    if (this.jumping) return;
    this.jumping = true;
    this.jumpVelocity = this.jumpV0;
    this.jumpOffset = 0;
  }

  updateJump(dt: number): boolean {
    if (!this.jumping) return false;
    this.jumpOffset += this.jumpVelocity * dt;
    this.jumpVelocity -= this.gravity * dt;
    if (this.jumpOffset <= 0) {
      this.jumpOffset = 0;
      this.jumping = false;
      this.jumpVelocity = 0;
      return true; // just landed
    }
    return false;
  }

  moveLeft() {
    this.tile--;
    if (this.tile < 0) {
      this.tile = TILES_PER_FACE - 1;
      this.face = (this.face + 3) % 4; // wrap to left adjacent face
    }
  }

  moveRight() {
    this.tile++;
    if (this.tile >= TILES_PER_FACE) {
      this.tile = 0;
      this.face = (this.face + 1) % 4; // wrap to right adjacent face
    }
  }

  getWorldPosition(z: number): THREE.Vector3 {
    const half = (TILES_PER_FACE * TILE_SIZE) / 2;
    const lateral = -half + this.tile * TILE_SIZE + TILE_SIZE / 2;
    const offset = this.jumpOffset + 0.3; // sphere radius

    switch (this.face) {
      case 0: // floor
        return new THREE.Vector3(lateral, offset, z);
      case 1: // right wall
        return new THREE.Vector3(half - offset, lateral + half, z);
      case 2: // ceiling
        return new THREE.Vector3(-lateral, half * 2 - offset, z);
      case 3: // left wall
        return new THREE.Vector3(-half + offset, -lateral + half, z);
      default:
        return new THREE.Vector3(0, offset, z);
    }
  }

  reset() {
    this.face = 0;
    this.tile = 2;
    this.jumping = false;
    this.jumpVelocity = 0;
    this.jumpOffset = 0;
  }
}
