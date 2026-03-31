import * as THREE from 'three';
import { TILES_PER_FACE, TILE_SIZE } from './types';

const ROTATION_SPEED = 10; // radians/s for smooth rotation

export class CameraController {
  camera: THREE.PerspectiveCamera;
  rig: THREE.Object3D;
  private targetAngle = 0;
  private currentAngle = 0;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.rig = new THREE.Object3D();
    this.rig.add(this.camera);

    const half = (TILES_PER_FACE * TILE_SIZE) / 2;
    // Position the rig at the center of the tunnel cross-section
    this.rig.position.set(0, half, 0);
    // Camera offset: looking down the tunnel
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, -10);
  }

  setFace(face: number) {
    this.targetAngle = (face * Math.PI) / 2;
    // Pick shortest rotation path
    const diff = this.targetAngle - this.currentAngle;
    const mod = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
    // Adjust target to be within π of current
    this.targetAngle = this.currentAngle + (mod > Math.PI ? mod - 2 * Math.PI : mod < -Math.PI ? mod + 2 * Math.PI : mod);
  }

  update(dt: number, playerZ: number) {
    // Smooth rotation towards target
    const diff = this.targetAngle - this.currentAngle;
    if (Math.abs(diff) > 0.001) {
      this.currentAngle += diff * Math.min(1, ROTATION_SPEED * dt);
    } else {
      this.currentAngle = this.targetAngle;
    }

    // Apply rotation around the Z axis (tunnel direction)
    this.rig.rotation.z = -this.currentAngle;
    this.rig.position.z = playerZ + 3;
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  reset() {
    this.targetAngle = 0;
    this.currentAngle = 0;
    this.rig.rotation.z = 0;
  }
}
