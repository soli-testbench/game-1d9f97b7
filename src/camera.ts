import * as THREE from 'three';
import {
  CAMERA_FOV, CAMERA_LERP_DURATION,
  TUNNEL_WIDTH, TUNNEL_HEIGHT,
  getFaceAngle,
} from './types';

export class CameraController {
  camera: THREE.PerspectiveCamera;
  private rig: THREE.Object3D;
  private targetAngle = 0;
  private currentAngle = 0;
  private lerpTimer = 0;
  private lerpFrom = 0;
  private lerpTo = 0;
  private isLerping = false;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    this.rig = new THREE.Object3D();
    this.rig.add(this.camera);

    // Position camera looking down the tunnel
    // Rig is at the center of the tunnel cross-section
    this.rig.position.set(TUNNEL_WIDTH / 2, TUNNEL_HEIGHT / 2, 0);

    // Camera offset from rig center: slightly below center (toward floor), near end
    this.camera.position.set(0, -TUNNEL_HEIGHT / 2 + 1.2, 1.5);
    this.camera.lookAt(new THREE.Vector3(0, -TUNNEL_HEIGHT / 2 + 0.8, -30));
  }

  get object(): THREE.Object3D {
    return this.rig;
  }

  setFace(face: number) {
    const newAngle = getFaceAngle(face);
    if (Math.abs(newAngle - this.targetAngle) < 0.01 &&
        Math.abs(newAngle - this.currentAngle) < 0.01) return;

    // Find shortest rotation path
    this.lerpFrom = this.currentAngle;
    this.lerpTo = newAngle;

    // Handle wrap-around (e.g., 3*PI/2 -> 0 should go +PI/2, not -3*PI/2)
    let diff = this.lerpTo - this.lerpFrom;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    this.lerpTo = this.lerpFrom + diff;

    this.targetAngle = newAngle;
    this.lerpTimer = 0;
    this.isLerping = true;
  }

  update(dt: number) {
    if (!this.isLerping) return;

    this.lerpTimer += dt;
    const t = Math.min(1, this.lerpTimer / CAMERA_LERP_DURATION);
    // Smooth ease-out
    const eased = 1 - Math.pow(1 - t, 3);
    this.currentAngle = this.lerpFrom + (this.lerpTo - this.lerpFrom) * eased;

    this.rig.rotation.z = this.currentAngle;

    if (t >= 1) {
      this.isLerping = false;
      this.currentAngle = this.targetAngle;
      // Normalize angle
      this.currentAngle = this.currentAngle % (Math.PI * 2);
      if (this.currentAngle < 0) this.currentAngle += Math.PI * 2;
      this.rig.rotation.z = this.currentAngle;
    }
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  reset() {
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.isLerping = false;
    this.rig.rotation.z = 0;
  }
}
