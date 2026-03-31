# Plan: Run Tunnel Game — 3D Perspective Endless Runner

## Overview

Build a complete, polished tunnel runner game inspired by "Run" from Cool Math Games. The player runs inside a rectangular tube made of grid tiles, some missing (holes). The tunnel scrolls toward the player with increasing speed. Falling through a hole = game over.

## Tech Stack

- **Three.js 0.183.x** — 3D rendering engine for the tunnel interior perspective
- **TypeScript** — type safety for game logic
- **Vite** — fast dev server + build tooling
- No additional game frameworks needed — Three.js handles all rendering, and game logic is custom

### Why Three.js over Canvas 2D

The game requires rendering the inside of a rectangular tunnel with perspective, camera rotation when switching faces, and consistent 3D depth. Three.js gives us:
- Native perspective camera (vanishing point for free)
- Camera rotation for edge wrapping (rotate 90 deg when moving to adjacent face)
- Efficient instanced rendering for hundreds of tile quads
- Built-in lighting for neon glow effects (emissive materials, bloom post-processing)

## Architecture

### Coordinate System

The tunnel is a long rectangular tube extending along the **-Z axis** (into the screen). The player runs "forward" by the tunnel scrolling toward them.

Four faces of the tunnel (cross-section):
- **Floor** (bottom): Y = 0, tiles in XZ plane
- **Ceiling** (top): Y = tunnelHeight, tiles in XZ plane
- **Left wall**: X = 0, tiles in YZ plane
- **Right wall**: X = tunnelWidth, tiles in YZ plane

Each face is a grid: ~5 tiles wide (lateral) x N tiles deep (scrolling direction). Tiles are ~1 unit square in world space.

### Core Modules

1. **TunnelGenerator** — generates tile rows with holes, manages the tile buffer (ring buffer of rows, recycled as they scroll past the camera). Ensures no two adjacent tiles are both holes. Difficulty increases hole density over time.

2. **TileRenderer** — creates Three.js mesh instances for each tile on each face. Uses `InstancedMesh` for performance. Missing tiles simply have no mesh. Tiles have emissive neon materials with face-specific colors. Hole edges get a dim glow border via additional thin meshes.

3. **Player** — tracks current face, lateral position (tile index on that face), and jump state. Rendered as a glowing sphere/capsule with emissive cyan material + bloom. Position updates based on input and physics.

4. **PlayerPhysics** — jump arc (parabolic, 380ms air time, 1.8x tile height). Gravity-based with deltaTime. Collision detection: check if the tile under the player is missing → game over if landing on hole.

5. **CameraController** — camera sits behind and slightly above the player, looking down the tunnel (-Z). When the player wraps to an adjacent face, the camera smoothly rotates 90 deg around the tunnel's Z-axis to follow.

6. **InputManager** — keydown listeners for Left, Right, Up, Space. Immediate response (keydown, not keyup). Tracks key state to prevent repeat-jump.

7. **GameState** — score (increments each second), speed (starts 280px/s, +12% every 8s), game phase (menu/playing/gameover). Manages reset for Play Again.

8. **HUD** — HTML overlay for score (top-right), game over screen (centered), and Play Again button. Not rendered in Three.js — simple DOM elements.

### Game Loop

```
requestAnimationFrame loop:
  1. Calculate deltaTime (capped at 50ms to prevent spiral)
  2. Update speed (12% increase every 8s)
  3. Scroll tunnel: move all tile rows toward camera by speed * dt
  4. Recycle rows that pass behind camera, generate new rows at far end
  5. Process input → update player lateral position / jump state
  6. Update player physics (jump arc)
  7. Check collision (is player's current tile a hole + player is at ground level?)
  8. Update camera (smooth rotation if face changed)
  9. Update score
  10. Render
```

### Visual Design: "Neon Grid" Aesthetic

- **Background**: Pure black (#000000)
- **Floor tiles**: Deep teal (#00CCAA) with emissive glow
- **Left wall**: Electric purple (#AA00FF)
- **Right wall**: Hot pink (#FF0066)
- **Ceiling**: Deep blue (#0044FF)
- **Grid lines**: Subtle 1px lines between tiles (slightly brighter than tile color, 30% opacity)
- **Player**: Bright cyan (#00FFFF) glowing sphere, shadowBlur equivalent via Three.js bloom
- **Holes**: Black void with 2px glowing border (face color at 40% opacity)
- **Post-processing**: UnrealBloomPass for neon glow on emissive materials

### Font & UI

- Font: **"Orbitron"** from Google Fonts (sci-fi geometric display font) for score + game over
- Score: top-right, white text with subtle text-shadow glow
- Game over: centered overlay with final score, "GAME OVER" title, "Play Again" button styled to match neon theme

## Key Decisions

1. **Single index.html entry** — Vite builds to `dist/` but we also ensure `npm run dev` works for development
2. **InstancedMesh for tiles** — one instanced mesh per face (4 total) rather than individual meshes. Handles hundreds of tiles efficiently.
3. **Ring buffer for tunnel** — only ~30 rows exist at any time. As rows scroll past the camera, they're recycled to the far end with new hole patterns.
4. **Edge wrapping via camera rotation** — when the player moves past the edge of a face, their face index changes and the camera target rotation updates. A smooth LERP over ~200ms handles the visual transition.
5. **HTML HUD over WebGL canvas** — simpler than rendering text in Three.js, easier to style.

## Risks & Mitigations

- **Performance with many tiles**: Mitigated by InstancedMesh + ring buffer (max ~600 tile instances at once)
- **Edge wrapping feel**: Needs careful tuning of camera rotation speed; too fast feels jarring, too slow feels laggy. Target: 200ms LERP.
- **Jump physics consistency**: All physics deltaTime-based, frame-capped at 50ms to prevent tunneling on lag spikes.
