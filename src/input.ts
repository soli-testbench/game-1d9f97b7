export type InputAction = 'left' | 'right' | 'jump';

export class InputManager {
  private queue: InputAction[] = [];
  private anyKeyPressed = false;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  private onKeyDown(e: KeyboardEvent) {
    this.anyKeyPressed = true;
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        this.queue.push('left');
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        this.queue.push('right');
        break;
      case 'ArrowUp':
      case 'Space':
      case 'KeyW':
        e.preventDefault();
        this.queue.push('jump');
        break;
    }
  }

  consumeAnyKey(): boolean {
    const v = this.anyKeyPressed;
    this.anyKeyPressed = false;
    return v;
  }

  drain(): InputAction[] {
    const actions = this.queue;
    this.queue = [];
    return actions;
  }
}
