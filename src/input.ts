export type InputAction = 'left' | 'right' | 'jump';

export class InputManager {
  private actions: Set<InputAction> = new Set();
  private consumed: Set<InputAction> = new Set();
  private anyKeyPressed = false;
  private anyKeyConsumed = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.anyKeyPressed = true;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.actions.add('left');
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.actions.add('right');
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.actions.add('jump');
        e.preventDefault();
        break;
    }
  };

  hasAction(action: InputAction): boolean {
    if (this.actions.has(action) && !this.consumed.has(action)) {
      this.consumed.add(action);
      return true;
    }
    return false;
  }

  hasAnyKey(): boolean {
    if (this.anyKeyPressed && !this.anyKeyConsumed) {
      this.anyKeyConsumed = true;
      return true;
    }
    return false;
  }

  clear() {
    this.actions.clear();
    this.consumed.clear();
    this.anyKeyPressed = false;
    this.anyKeyConsumed = false;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
