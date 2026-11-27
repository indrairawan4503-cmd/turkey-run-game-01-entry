// Thanksgiving Heist — keyboard input.
// One job: turn key presses into a small, testable input state.
export class Input {
  constructor() {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.run = false;
    this.pressed = {}; // edge-triggered keys, consumed by the game loop
    this._onKeyDown = (e) => this._key(e, true);
    this._onKeyUp = (e) => this._key(e, false);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _key(e, down) {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    switch (k) {
      case 'arrowup':
      case 'w':
        this.up = down;
        break;
      case 'arrowdown':
      case 's':
        this.down = down;
        break;
      case 'arrowleft':
      case 'a':
        this.left = down;
        break;
      case 'arrowright':
      case 'd':
        this.right = down;
        break;
      case 'shift':
        this.run = down;
        break;
      default:
        if (down) this.pressed[k] = true;
        break;
    }
  }

  // True once for the frame the key was pressed.
  wasPressed(key) {
    if (this.pressed[key]) {
      this.pressed[key] = false;
      return true;
    }
    return false;
  }

  clearPressed() {
    this.pressed = {};
  }
}
