import { GameState } from './types';

export class HUD {
  private scoreEl: HTMLElement;
  private startScreen: HTMLElement;
  private gameOverScreen: HTMLElement;
  private finalScoreEl: HTMLElement;
  private playAgainBtn: HTMLElement;
  onPlayAgain: (() => void) | null = null;

  constructor() {
    this.scoreEl = document.getElementById('score')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.gameOverScreen = document.getElementById('game-over')!;
    this.finalScoreEl = document.getElementById('final-score-value')!;
    this.playAgainBtn = document.getElementById('play-again')!;

    this.playAgainBtn.addEventListener('click', () => {
      if (this.onPlayAgain) this.onPlayAgain();
    });
  }

  updateScore(score: number) {
    this.scoreEl.textContent = Math.floor(score).toString();
  }

  setState(state: GameState, score?: number) {
    this.startScreen.style.display = state === GameState.START ? 'flex' : 'none';
    this.gameOverScreen.style.display = state === GameState.GAME_OVER ? 'flex' : 'none';
    this.scoreEl.style.display = state === GameState.PLAYING ? 'block' : 'none';

    if (state === GameState.GAME_OVER && score !== undefined) {
      this.finalScoreEl.textContent = Math.floor(score).toString();
    }
  }
}
