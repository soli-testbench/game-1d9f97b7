import * as THREE from 'three';
import {
  TILE_SIZE, TILES_WIDE, TILE_GAP, VISIBLE_ROWS,
  FACE_COUNT, FACE_COLORS,
  TileRow, getTilePosition, getTileRotation,
} from './types';

export class Tunnel {
  rows: TileRow[] = [];
  faceMeshes: THREE.InstancedMesh[] = [];
  holeBorders: THREE.Group;
  private nextZ = 0;
  private tileGeom: THREE.PlaneGeometry;
  private borderGeom: THREE.BufferGeometry;
  private maxInstances: number;
  private difficulty = 0.15;

  constructor(private scene: THREE.Scene) {
    const tileVisualSize = TILE_SIZE - TILE_GAP;
    this.tileGeom = new THREE.PlaneGeometry(tileVisualSize, tileVisualSize);
    this.maxInstances = VISIBLE_ROWS * TILES_WIDE;
    this.holeBorders = new THREE.Group();
    this.scene.add(this.holeBorders);
    this.borderGeom = this.createBorderGeometry();

    for (let f = 0; f < FACE_COUNT; f++) {
      const mat = new THREE.MeshStandardMaterial({
        color: FACE_COLORS[f],
        emissive: FACE_COLORS[f],
        emissiveIntensity: 0.6,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.InstancedMesh(this.tileGeom, mat, this.maxInstances);
      mesh.count = 0;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.faceMeshes.push(mesh);
    }

    this.nextZ = 2;
    for (let i = 0; i < VISIBLE_ROWS; i++) {
      this.addRow(i < 8);
    }
    this.rebuildMeshes();
  }

  private createBorderGeometry(): THREE.BufferGeometry {
    const s = TILE_SIZE;
    const w = 0.04;
    const shape = new THREE.Shape();
    shape.moveTo(-s / 2, -s / 2);
    shape.lineTo(s / 2, -s / 2);
    shape.lineTo(s / 2, s / 2);
    shape.lineTo(-s / 2, s / 2);
    shape.closePath();
    const holePath = new THREE.Path();
    holePath.moveTo(-s / 2 + w, -s / 2 + w);
    holePath.lineTo(s / 2 - w, -s / 2 + w);
    holePath.lineTo(s / 2 - w, s / 2 - w);
    holePath.lineTo(-s / 2 + w, s / 2 - w);
    holePath.closePath();
    shape.holes.push(holePath);
    return new THREE.ShapeGeometry(shape);
  }

  private generateFaceHoles(face: number, safe: boolean): boolean[] {
    if (safe) return new Array(TILES_WIDE).fill(false);
    const holes: boolean[] = [];
    for (let i = 0; i < TILES_WIDE; i++) {
      if (i > 0 && holes[i - 1]) {
        holes.push(false);
      } else {
        holes.push(Math.random() < this.difficulty);
      }
    }
    if (holes.every(h => h)) holes[Math.floor(Math.random() * TILES_WIDE)] = false;

    // Avoid consecutive same-position holes
    if (this.rows.length > 0) {
      const prevRow = this.rows[this.rows.length - 1];
      for (let i = 0; i < TILES_WIDE; i++) {
        if (holes[i] && prevRow.holes[face][i]) {
          holes[i] = false;
        }
      }
    }
    return holes;
  }

  private addRow(safe: boolean) {
    const holesPerFace: boolean[][] = [];
    for (let f = 0; f < FACE_COUNT; f++) {
      holesPerFace.push(this.generateFaceHoles(f, safe));
    }
    this.rows.push({ holes: holesPerFace, z: this.nextZ });
    this.nextZ -= TILE_SIZE;
  }

  setDifficulty(d: number) {
    this.difficulty = Math.min(0.4, Math.max(0.15, d));
  }

  scroll(amount: number) {
    for (const row of this.rows) {
      row.z += amount;
    }

    let recycled = false;
    while (this.rows.length > 0 && this.rows[0].z > 4) {
      this.rows.shift();
      this.addRow(false);
      recycled = true;
    }

    if (recycled) {
      this.rebuildMeshes();
    } else {
      this.updateMeshPositions();
    }
  }

  private updateMeshPositions() {
    const dummy = new THREE.Object3D();
    for (let f = 0; f < FACE_COUNT; f++) {
      const rotation = getTileRotation(f);
      let idx = 0;
      for (const row of this.rows) {
        for (let lane = 0; lane < TILES_WIDE; lane++) {
          if (!row.holes[f][lane]) {
            const pos = getTilePosition(f, lane, row.z);
            dummy.position.copy(pos);
            dummy.rotation.copy(rotation);
            dummy.updateMatrix();
            this.faceMeshes[f].setMatrixAt(idx, dummy.matrix);
            idx++;
          }
        }
      }
      this.faceMeshes[f].instanceMatrix.needsUpdate = true;
    }
  }

  rebuildMeshes() {
    const dummy = new THREE.Object3D();

    while (this.holeBorders.children.length > 0) {
      this.holeBorders.remove(this.holeBorders.children[0]);
    }

    for (let f = 0; f < FACE_COUNT; f++) {
      const rotation = getTileRotation(f);
      let idx = 0;

      for (const row of this.rows) {
        for (let lane = 0; lane < TILES_WIDE; lane++) {
          if (!row.holes[f][lane]) {
            const pos = getTilePosition(f, lane, row.z);
            dummy.position.copy(pos);
            dummy.rotation.copy(rotation);
            dummy.updateMatrix();
            this.faceMeshes[f].setMatrixAt(idx, dummy.matrix);
            idx++;
          } else {
            const borderMat = new THREE.MeshStandardMaterial({
              color: FACE_COLORS[f],
              emissive: FACE_COLORS[f],
              emissiveIntensity: 0.3,
              transparent: true,
              opacity: 0.4,
              side: THREE.DoubleSide,
            });
            const borderMesh = new THREE.Mesh(this.borderGeom, borderMat);
            const pos = getTilePosition(f, lane, row.z);
            borderMesh.position.copy(pos);
            borderMesh.rotation.copy(rotation);
            this.holeBorders.add(borderMesh);
          }
        }
      }

      this.faceMeshes[f].count = idx;
      this.faceMeshes[f].instanceMatrix.needsUpdate = true;
    }
  }

  isTileHole(face: number, rowZ: number, laneIndex: number): boolean {
    let closest: TileRow | null = null;
    let closestDist = Infinity;
    for (const row of this.rows) {
      const dist = Math.abs(row.z - rowZ);
      if (dist < closestDist) {
        closestDist = dist;
        closest = row;
      }
    }
    if (!closest || closestDist > TILE_SIZE * 0.6) return false;
    return closest.holes[face]?.[laneIndex] ?? false;
  }

  reset() {
    this.rows = [];
    this.nextZ = 2;
    this.difficulty = 0.15;
    for (let i = 0; i < VISIBLE_ROWS; i++) {
      this.addRow(i < 8);
    }
    this.rebuildMeshes();
  }

  dispose() {
    for (const mesh of this.faceMeshes) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.scene.remove(this.holeBorders);
    this.tileGeom.dispose();
  }
}
