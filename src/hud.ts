export class HUD {
  private scoreEl: HTMLElement;
  private startScreen: HTMLElement;
  private gameOverScreen: HTMLElement;
  private finalScoreEl: HTMLElement;
  private playAgainBtn: HTMLElement;
  private onPlayAgain: () => void;

  constructor(onPlayAgain: () => void) {
    this.scoreEl = document.getElementById('score')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.gameOverScreen = document.getElementById('game-over')!;
    this.finalScoreEl = document.getElementById('final-score-value')!;
    this.playAgainBtn = document.getElementById('play-again')!;
    this.onPlayAgain = onPlayAgain;

    this.playAgainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onPlayAgain();
    });
  }

  showMenu() {
    this.startScreen.style.display = 'flex';
    this.gameOverScreen.style.display = 'none';
    this.scoreEl.style.display = 'none';
  }

  showPlaying() {
    this.startScreen.style.display = 'none';
    this.gameOverScreen.style.display = 'none';
    this.scoreEl.style.display = 'block';
    this.updateScore(0);
  }

  showGameOver(score: number) {
    this.gameOverScreen.style.display = 'flex';
    this.finalScoreEl.textContent = String(score);
  }

  updateScore(score: number) {
    this.scoreEl.textContent = String(score);
  }
}
