import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Tunnel } from './tunnel';
import { Player } from './player';
import { CameraController } from './camera';
import { InputManager } from './input';
import { HUD } from './hud';
import {
  GameState,
  INITIAL_SPEED,
  SPEED_MULTIPLIER,
  SPEED_INTERVAL,
  PLAYER_Z_OFFSET,
  TILES_PER_FACE,
  TILE_SIZE,
} from './types';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private composer: EffectComposer;
  private tunnel: Tunnel;
  private player: Player;
  private cam: CameraController;
  private input: InputManager;
  private hud: HUD;

  private state = GameState.START;
  private score = 0;
  private elapsed = 0;
  private speed = INITIAL_SPEED;
  private lastSpeedUp = 0;
  private playerZ = 0;
  private clock = new THREE.Clock(false);

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Ambient light for baseline visibility
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    container.insertBefore(this.renderer.domElement, container.firstChild);

    this.cam = new CameraController();
    this.scene.add(this.cam.rig);

    // Bloom post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam.camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.1
    );
    this.composer.addPass(bloom);

    this.tunnel = new Tunnel(this.scene);
    this.player = new Player(this.scene);
    this.input = new InputManager();
    this.hud = new HUD();
    this.hud.setState(GameState.START);
    this.hud.onPlayAgain = () => this.restart();

    window.addEventListener('resize', () => this.onResize());

    this.updatePlayerPosition();
    this.loop();
  }

  private restart() {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.elapsed = 0;
    this.speed = INITIAL_SPEED;
    this.lastSpeedUp = 0;
    this.playerZ = 0;
    this.tunnel.reset();
    this.player.reset();
    this.cam.reset();
    this.hud.setState(GameState.PLAYING);
    this.hud.updateScore(0);
    this.updatePlayerPosition();
    this.clock.start();
  }

  private loop = () => {
    requestAnimationFrame(this.loop);

    if (this.state === GameState.START) {
      if (this.input.consumeAnyKey()) {
        this.restart();
      }
      this.composer.render();
      return;
    }

    if (this.state === GameState.GAME_OVER) {
      this.input.drain();
      this.input.consumeAnyKey();
      this.composer.render();
      return;
    }

    // Playing
    let dt = this.clock.getDelta();
    dt = Math.min(dt, 0.05);

    this.elapsed += dt;
    this.score = this.elapsed;

    // Speed increase
    if (this.elapsed - this.lastSpeedUp >= SPEED_INTERVAL) {
      this.speed *= SPEED_MULTIPLIER;
      this.lastSpeedUp += SPEED_INTERVAL;
    }

    // Process input
    const actions = this.input.drain();
    this.input.consumeAnyKey();
    const prevFace = this.player.face;

    for (const action of actions) {
      switch (action) {
        case 'left':
          this.player.moveLeft();
          break;
        case 'right':
          this.player.moveRight();
          break;
        case 'jump':
          this.player.jump();
          break;
      }
    }

    if (this.player.face !== prevFace) {
      this.cam.setFace(this.player.face);
    }

    // Jump physics
    const landed = this.player.updateJump(dt);

    // Scroll tunnel
    const dz = this.speed * dt;
    this.tunnel.scroll(dz, this.elapsed);

    // Check collision — player position in tunnel
    const playerRowZ = this.playerZ - PLAYER_Z_OFFSET;

    // Check if standing on a hole (only when not jumping or just landed)
    if (!this.player.jumping) {
      if (this.tunnel.isHole(this.player.face, this.player.tile, playerRowZ)) {
        this.gameOver();
        return;
      }
    }
    if (landed) {
      if (this.tunnel.isHole(this.player.face, this.player.tile, playerRowZ)) {
        this.gameOver();
        return;
      }
    }

    this.updatePlayerPosition();
    this.cam.update(dt, this.playerZ);
    this.hud.updateScore(this.score);
    this.composer.render();
  };

  private updatePlayerPosition() {
    const z = this.playerZ - PLAYER_Z_OFFSET;
    const pos = this.player.getWorldPosition(z);
    this.mesh.position.copy(pos);
  }

  private get mesh() {
    return this.player.mesh;
  }

  private gameOver() {
    this.state = GameState.GAME_OVER;
    this.clock.stop();
    this.hud.setState(GameState.GAME_OVER, this.score);
  }

  private onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.cam.resize();
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}
