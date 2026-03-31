import * as THREE from 'three';
import {
  TILE_SIZE,
  TILES_PER_FACE,
  TUNNEL_LENGTH,
  FACE_COLORS,
  HOLE_DENSITY_START,
  HOLE_DENSITY_MAX,
  HOLE_DENSITY_RAMP,
  TileRow,
} from './types';

const GAP = 0.03;
const TILE_GEOM_SIZE = TILE_SIZE - GAP;
const BORDER_WIDTH = 0.04;

export class Tunnel {
  rows: TileRow[] = [];
  meshes: THREE.InstancedMesh[] = [];
  borderMeshes: THREE.InstancedMesh[] = [];
  group = new THREE.Group();
  private dummy = new THREE.Object3D();
  private maxInstances: number;
  private prevRowHoles: boolean[][] | null = null;

  constructor(private scene: THREE.Scene) {
    this.maxInstances = TUNNEL_LENGTH * TILES_PER_FACE;
    this.createMeshes();
    this.generateInitialRows();
  }

  private createMeshes() {
    const tileGeom = new THREE.PlaneGeometry(TILE_GEOM_SIZE, TILE_GEOM_SIZE);
    const borderGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);

    for (let f = 0; f < 4; f++) {
      const color = FACE_COLORS[f];
      const mat = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: color,
        emissiveIntensity: 0.7,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.InstancedMesh(tileGeom, mat, this.maxInstances);
      mesh.count = 0;
      mesh.frustumCulled = false;
      this.meshes.push(mesh);
      this.group.add(mesh);

      const borderMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const borderMesh = new THREE.InstancedMesh(borderGeom, borderMat, this.maxInstances);
      borderMesh.count = 0;
      borderMesh.frustumCulled = false;
      this.borderMeshes.push(borderMesh);
      this.group.add(borderMesh);
    }
    this.scene.add(this.group);
  }

  generateRow(z: number, elapsed: number): TileRow {
    const density = Math.min(
      HOLE_DENSITY_MAX,
      HOLE_DENSITY_START + (HOLE_DENSITY_MAX - HOLE_DENSITY_START) * (elapsed / HOLE_DENSITY_RAMP)
    );
    const holes: boolean[][] = [];
    for (let f = 0; f < 4; f++) {
      const faceHoles: boolean[] = [];
      for (let t = 0; t < TILES_PER_FACE; t++) {
        let isHole = Math.random() < density;
        // No adjacent holes in the same row
        if (isHole && t > 0 && faceHoles[t - 1]) {
          isHole = false;
        }
        // No consecutive holes at the same position across rows
        if (isHole && this.prevRowHoles && this.prevRowHoles[f][t]) {
          isHole = false;
        }
        faceHoles.push(isHole);
      }
      // Ensure at least 1 solid tile per face per row
      if (faceHoles.every((h) => h)) {
        faceHoles[Math.floor(Math.random() * TILES_PER_FACE)] = false;
      }
      holes.push(faceHoles);
    }
    this.prevRowHoles = holes;
    return { z, holes };
  }

  private generateInitialRows() {
    for (let i = 0; i < TUNNEL_LENGTH; i++) {
      const z = -i * TILE_SIZE;
      // First 6 rows always solid (safe zone)
      if (i < 6) {
        const holes = Array.from({ length: 4 }, () => Array(TILES_PER_FACE).fill(false));
        this.rows.push({ z, holes });
        this.prevRowHoles = holes;
      } else {
        this.rows.push(this.generateRow(z, 0));
      }
    }
    this.rebuildMeshes();
  }

  rebuildMeshes() {
    const counts = [0, 0, 0, 0];
    const borderCounts = [0, 0, 0, 0];

    for (const row of this.rows) {
      for (let f = 0; f < 4; f++) {
        for (let t = 0; t < TILES_PER_FACE; t++) {
          if (!row.holes[f][t]) {
            this.positionTile(f, t, row.z, this.dummy);
            const idx = counts[f]++;
            if (idx < this.maxInstances) {
              this.meshes[f].setMatrixAt(idx, this.dummy.matrix);
            }
          } else {
            // Border around hole
            this.positionTile(f, t, row.z, this.dummy);
            const bIdx = borderCounts[f]++;
            if (bIdx < this.maxInstances) {
              this.borderMeshes[f].setMatrixAt(bIdx, this.dummy.matrix);
            }
          }
        }
      }
    }

    for (let f = 0; f < 4; f++) {
      this.meshes[f].count = Math.min(counts[f], this.maxInstances);
      this.meshes[f].instanceMatrix.needsUpdate = true;
      this.borderMeshes[f].count = Math.min(borderCounts[f], this.maxInstances);
      this.borderMeshes[f].instanceMatrix.needsUpdate = true;
    }
  }

  private positionTile(face: number, tile: number, z: number, obj: THREE.Object3D) {
    const half = (TILES_PER_FACE * TILE_SIZE) / 2;
    const lateral = -half + tile * TILE_SIZE + TILE_SIZE / 2;

    switch (face) {
      case 0: // floor
        obj.position.set(lateral, 0, z);
        obj.rotation.set(-Math.PI / 2, 0, 0);
        break;
      case 1: // right wall
        obj.position.set(half, lateral + half, z);
        obj.rotation.set(0, -Math.PI / 2, 0);
        break;
      case 2: // ceiling
        obj.position.set(-lateral, half * 2, z);
        obj.rotation.set(Math.PI / 2, 0, 0);
        break;
      case 3: // left wall
        obj.position.set(-half, -lateral + half, z);
        obj.rotation.set(0, Math.PI / 2, 0);
        break;
    }
    obj.updateMatrix();
  }

  scroll(dz: number, elapsed: number) {
    for (const row of this.rows) {
      row.z += dz;
    }
    // Recycle rows that have passed behind the camera
    while (this.rows.length > 0 && this.rows[0].z > 5) {
      this.rows.shift();
    }
    // Add new rows at the far end
    while (this.rows.length < TUNNEL_LENGTH) {
      const lastZ = this.rows.length > 0 ? this.rows[this.rows.length - 1].z : 0;
      const newZ = lastZ - TILE_SIZE;
      this.rows.push(this.generateRow(newZ, elapsed));
    }
    this.rebuildMeshes();
  }

  isHole(face: number, tile: number, z: number): boolean {
    // Find the row closest to z
    let closest: TileRow | null = null;
    let minDist = Infinity;
    for (const row of this.rows) {
      const d = Math.abs(row.z - z);
      if (d < minDist) {
        minDist = d;
        closest = row;
      }
    }
    if (!closest || minDist > TILE_SIZE * 0.6) return false;
    return closest.holes[face]?.[tile] ?? false;
  }

  reset() {
    this.rows = [];
    this.prevRowHoles = null;
    this.generateInitialRows();
  }
}
