import {
  INITIAL_SPEED, SPEED_INCREASE, SPEED_INTERVAL, MAX_DT,
  GamePhase,
} from './types';
import { Tunnel } from './tunnel';
import { Player } from './player';
import { CameraController } from './camera';
import { InputManager } from './input';
import { HUD } from './hud';

export class Game {
  phase: GamePhase = 'menu';
  score = 0;
  speed = INITIAL_SPEED;
  private elapsed = 0; // total playing time
  private scoreTimer = 0;
  private speedTimer = 0;
  tunnel: Tunnel;
  player: Player;
  camera: CameraController;
  input: InputManager;
  hud: HUD;

  constructor(
    tunnel: Tunnel,
    player: Player,
    camera: CameraController,
    input: InputManager,
    hud: HUD,
  ) {
    this.tunnel = tunnel;
    this.player = player;
    this.camera = camera;
    this.input = input;
    this.hud = hud;
    this.hud.showMenu();
  }

  update(rawDt: number) {
    const dt = Math.min(rawDt, MAX_DT);

    if (this.phase === 'menu') {
      // Wait for any key
      if (this.input.hasAnyKey()) {
        this.start();
      }
      this.input.clear();
      return;
    }

    if (this.phase === 'gameover') {
      this.input.clear();
      return;
    }

    // Playing
    this.elapsed += dt;

    // Speed increase every SPEED_INTERVAL seconds
    this.speedTimer += dt;
    if (this.speedTimer >= SPEED_INTERVAL) {
      this.speedTimer -= SPEED_INTERVAL;
      this.speed *= (1 + SPEED_INCREASE);
      // Increase hole difficulty too
      const difficultyPct = 0.15 + (this.elapsed / 60) * 0.25;
      this.tunnel.setDifficulty(difficultyPct);
    }

    // Scroll tunnel
    const scrollAmount = this.speed * dt;
    this.tunnel.scroll(scrollAmount);

    // Process input
    this.processInput();

    // Update physics
    this.player.updatePhysics(dt);

    // Check collision
    if (this.player.isOnGround) {
      const isHole = this.tunnel.isTileHole(this.player.face, this.player.playerZ, this.player.lane);
      if (isHole) {
        this.gameOver();
        this.input.clear();
        return;
      }
    }

    // Update score (1 point per second)
    this.scoreTimer += dt;
    if (this.scoreTimer >= 1) {
      this.scoreTimer -= 1;
      this.score++;
      this.hud.updateScore(this.score);
    }

    // Update camera
    this.camera.update(dt);

    this.input.clear();
  }

  private processInput() {
    if (this.input.hasAction('left')) {
      const faceChanged = this.player.moveLeft();
      if (faceChanged) this.camera.setFace(this.player.face);
    }
    if (this.input.hasAction('right')) {
      const faceChanged = this.player.moveRight();
      if (faceChanged) this.camera.setFace(this.player.face);
    }
    if (this.input.hasAction('jump')) {
      this.player.jump();
    }
  }

  private start() {
    this.phase = 'playing';
    this.hud.showPlaying();
  }

  private gameOver() {
    this.phase = 'gameover';
    this.hud.showGameOver(this.score);
  }

  restart() {
    this.phase = 'playing';
    this.score = 0;
    this.speed = INITIAL_SPEED;
    this.elapsed = 0;
    this.scoreTimer = 0;
    this.speedTimer = 0;
    this.tunnel.reset();
    this.player.reset();
    this.camera.reset();
    this.hud.showPlaying();
    this.input.clear();
  }
}
