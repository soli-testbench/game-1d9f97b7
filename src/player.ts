import * as THREE from 'three';
import {
  PLAYER_RADIUS, PLAYER_COLOR,
  JUMP_HEIGHT, JUMP_HALF_TIME,
  TILES_WIDE, FACE_FLOOR,
  getPlayerWorldPosition, getAdjacentFace,
} from './types';

export class Player {
  mesh: THREE.Mesh;
  face = FACE_FLOOR;
  lane = 2; // middle tile
  heightOffset = 0;
  private jumping = false;
  private jumpVelocity = 0;
  private gravity: number;
  private jumpV0: number;
  playerZ = -3; // z position in world (near camera)

  constructor(scene: THREE.Scene) {
    const geom = new THREE.SphereGeometry(PLAYER_RADIUS, 24, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: PLAYER_COLOR,
      emissive: PLAYER_COLOR,
      emissiveIntensity: 2.0,
    });
    this.mesh = new THREE.Mesh(geom, mat);
    scene.add(this.mesh);

    // Physics: v0 = 2*h/t, g = 2*h/t^2
    this.jumpV0 = (2 * JUMP_HEIGHT) / JUMP_HALF_TIME;
    this.gravity = (2 * JUMP_HEIGHT) / (JUMP_HALF_TIME * JUMP_HALF_TIME);

    this.updateMeshPosition();
  }

  moveLeft(): boolean {
    const [newFace, newLane] = getAdjacentFace(this.face, this.lane, -1);
    const faceChanged = newFace !== this.face;
    this.face = newFace;
    this.lane = newLane;
    this.updateMeshPosition();
    return faceChanged;
  }

  moveRight(): boolean {
    const [newFace, newLane] = getAdjacentFace(this.face, this.lane, 1);
    const faceChanged = newFace !== this.face;
    this.face = newFace;
    this.lane = newLane;
    this.updateMeshPosition();
    return faceChanged;
  }

  jump(): boolean {
    if (this.jumping) return false;
    this.jumping = true;
    this.jumpVelocity = this.jumpV0;
    return true;
  }

  get isAirborne(): boolean {
    return this.jumping;
  }

  get isOnGround(): boolean {
    return !this.jumping && this.heightOffset <= 0.01;
  }

  updatePhysics(dt: number) {
    if (!this.jumping) return;

    this.heightOffset += this.jumpVelocity * dt;
    this.jumpVelocity -= this.gravity * dt;

    if (this.heightOffset <= 0) {
      this.heightOffset = 0;
      this.jumping = false;
      this.jumpVelocity = 0;
    }

    this.updateMeshPosition();
  }

  updateMeshPosition() {
    const pos = getPlayerWorldPosition(this.face, this.lane, this.playerZ, this.heightOffset);
    this.mesh.position.copy(pos);
  }

  reset() {
    this.face = FACE_FLOOR;
    this.lane = 2;
    this.heightOffset = 0;
    this.jumping = false;
    this.jumpVelocity = 0;
    this.updateMeshPosition();
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
