// Thanksgiving Heist — the turkey: movement, noise and hiding.
// One job: where the turkey is, how fast and loud it moves, and when it is hidden.
import { TILE, PLAYER } from './config.js';
import { STAGES, circleClear, tileCenter } from './stages.js';

export class Turkey {
  constructor(stageIndex) {
    this.reset(stageIndex);
  }

  reset(stageIndex) {
    const stage = STAGES[stageIndex];
    const c = tileCenter(stage.start);
    this.x = c.x;
    this.y = c.y;
    this.dirX = 1;
    this.dirY = 0;
    this.moving = false;
    this.running = false;
    this.hidden = false;
    this.hideKind = null;
    this.noise = 0;
    this.heat = 0;
    this.invulnerableUntil = 0;
    this.stepPhase = 0;
  }

  // Current tile the turkey stands on.
  tile() {
    return { x: Math.floor(this.x / TILE), y: Math.floor(this.y / TILE) };
  }

  isHiddenSpot(stage) {
    const t = this.tile();
    for (const h of stage.hides) {
      if (h.x === t.x && h.y === t.y) return h;
    }
    return null;
  }

  update(dt, input, stage, now) {
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    const len = Math.hypot(mx, my);
    this.moving = len > 0;
    this.running = this.moving && input.run;

    // Hiding: stand still on a haystack or in a barrel and you vanish.
    const spot = this.isHiddenSpot(stage);
    this.hidden = !this.moving && spot !== null;
    this.hideKind = this.hidden ? spot.kind : null;

    if (this.moving) {
      mx /= len;
      my /= len;
      this.dirX = mx;
      this.dirY = my;
      this.stepPhase += dt * (this.running ? 11 : 7);
      const speed = this.running ? PLAYER.runSpeed : PLAYER.walkSpeed;
      const nx = this.x + mx * speed * dt;
      const ny = this.y + my * speed * dt;
      // Axis-separated movement so the turkey slides along walls.
      if (circleClear(stage, nx, this.y, PLAYER.radius)) this.x = nx;
      if (circleClear(stage, this.x, ny, PLAYER.radius)) this.y = ny;
    }

    // Noise: running is loud, walking is a whisper, hiding is silent.
    if (this.hidden) {
      this.noise = Math.max(0, this.noise - PLAYER.noiseDecay * 2 * dt);
    } else if (this.running) {
      this.noise = Math.min(100, this.noise + PLAYER.runNoise * dt);
    } else if (this.moving) {
      this.noise = Math.min(100, this.noise + PLAYER.walkNoise * dt);
    } else {
      this.noise = Math.max(0, this.noise - PLAYER.noiseDecay * dt);
    }

    // Oven heat: standing in a heat zone cooks the turkey.
    let inHeat = false;
    for (const o of stage.ovens) {
      if (
        this.x >= o.x * TILE && this.x < (o.x + o.w) * TILE &&
        this.y >= o.y * TILE && this.y < (o.y + o.h) * TILE
      ) {
        inHeat = true;
      }
    }
    if (inHeat) {
      this.heat = Math.min(100, this.heat + 55 * dt);
    } else {
      this.heat = Math.max(0, this.heat - 34 * dt);
    }
    return { inHeat };
  }

  get invulnerable() {
    return performance.now() < this.invulnerableUntil;
  }
}
