import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { Tunnel } from './tunnel';
import { Player } from './player';
import { CameraController } from './camera';
import { InputManager } from './input';
import { HUD } from './hud';
import { Game } from './game';

// Renderer
const container = document.getElementById('canvas-container')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
container.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Ambient light
scene.add(new THREE.AmbientLight(0xffffff, 0.15));

// Point light near the player
const playerLight = new THREE.PointLight(0x00ffff, 2, 15);
playerLight.position.set(2.5, 1, -2);
scene.add(playerLight);

// Create game objects
const cameraCtrl = new CameraController();
scene.add(cameraCtrl.object);

const tunnel = new Tunnel(scene);
const player = new Player(scene);
const input = new InputManager();

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cameraCtrl.camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.1   // threshold
);
composer.addPass(bloomPass);

// HUD & Game
let game: Game;
const hud = new HUD(() => game.restart());
game = new Game(tunnel, player, cameraCtrl, input, hud);

// Resize handler
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  cameraCtrl.resize();
});

// Game loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  game.update(dt);

  // Keep player light near the player
  playerLight.position.copy(player.mesh.position);
  playerLight.position.z += 1;

  composer.render();
}

animate();
