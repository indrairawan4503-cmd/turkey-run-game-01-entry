// Thanksgiving Heist — the farmer (and the farm dog): patrol, spot, chase, search.
// One job: the pursuer brain. States: patrol -> suspicious -> chase -> search -> patrol.
import { TILE, FARMER, DOG } from './config.js';
import { tileCenter, lineOfSight, circleClear } from './stages.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Patroller {
  // kind: 'farmer' | 'dog'. def: { waypoints, speed } from the stage data.
  constructor(kind, def) {
    this.kind = kind;
    this.cfg = kind === 'dog' ? DOG : FARMER;
    this.speedMul = def.speed || 1;
    this.waypoints = def.waypoints.map(([x, y]) => tileCenter({ x, y }));
    this.wpIndex = 0;
    const start = this.waypoints[0];
    this.x = start.x;
    this.y = start.y;
    this.facing = 0; // radians, 0 = facing right
    this.state = 'patrol';
    this.detect = 0; // 0..1 detection meter
    this.lastSeen = null;
    this.loseSightTimer = 0;
    this.searchTimer = 0;
    this.investigateTarget = null;
    this.alertFlash = 0;
    this.barkTimer = 0;
  }

  get speed() {
    if (this.state === 'chase') return this.cfg.chaseSpeed * this.speedMul;
    if (this.state === 'search') return this.cfg.searchSpeed * this.speedMul;
    return this.cfg.patrolSpeed * this.speedMul;
  }

  // Can this patroller currently see the turkey?
  canSee(stage, turkey) {
    if (turkey.hidden) return false;
    const dx = turkey.x - this.x;
    const dy = turkey.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.cfg.visionRange) return false;
    const ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, this.facing)) > this.cfg.visionHalfAngle + 0.25) return false;
    return lineOfSight(stage, this.x, this.y, turkey.x, turkey.y);
  }

  moveToward(stage, tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, this.speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.facing = Math.atan2(dy, dx);
    if (circleClear(stage, nx, this.y, 14)) this.x = nx;
    if (circleClear(stage, this.x, ny, 14)) this.y = ny;
    return dist <= step + 1;
  }

  update(dt, stage, turkey, now) {
    const seen = this.canSee(stage, turkey);
    if (seen) {
      this.detect = Math.min(1, this.detect + this.cfg.detectRate * dt);
      this.lastSeen = { x: turkey.x, y: turkey.y };
      this.loseSightTimer = 0;
    } else {
      this.detect = Math.max(0, this.detect - this.cfg.detectDecay * dt);
      this.loseSightTimer += dt;
    }

    // Loud running draws an investigation even without a sighting.
    if (this.state === 'patrol' && turkey.noise > 62 && !turkey.hidden) {
      this.state = 'search';
      this.investigateTarget = { x: turkey.x, y: turkey.y };
      this.searchTimer = 0;
    }

    if (this.detect >= 1 && this.state !== 'chase') {
      this.state = 'chase';
      this.alertFlash = 1;
    }

    if (this.state === 'patrol') {
      const target = this.waypoints[this.wpIndex];
      if (this.moveToward(stage, target.x, target.y, dt)) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      }
    } else if (this.state === 'chase') {
      if (this.lastSeen) this.moveToward(stage, this.lastSeen.x, this.lastSeen.y, dt);
      if (!seen && this.loseSightTimer > FARMER.loseSightTime) {
        this.state = 'search';
        this.searchTimer = 0;
      }
    } else if (this.state === 'search') {
      const target = this.investigateTarget || this.lastSeen || this.waypoints[this.wpIndex];
      if (this.moveToward(stage, target.x, target.y, dt)) {
        // Arrived: look around, then give up and go back to patrol.
        this.searchTimer += dt;
        this.facing += dt * 1.6;
        if (this.searchTimer > 2.2) {
          this.state = 'patrol';
          this.investigateTarget = null;
          this.searchTimer = 0;
        }
      }
    }

    if (this.alertFlash > 0) this.alertFlash = Math.max(0, this.alertFlash - dt * 1.4);
    if (this.state === 'chase') this.barkTimer += dt;

    // While the turkey is in view (or was just seen), the patroller stares
    // at it instead of turning back to the patrol route — so a glimpse
    // fills the detection meter instead of being forgotten in one frame.
    if (seen || (this.detect > 0.35 && this.lastSeen)) {
      this.facing = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
    }

    // Caught? Only when chasing and close — a patroller that merely bumps
    // into the turkey on patrol is startled, not a catch (fair narrow escapes).
    const dist = Math.hypot(turkey.x - this.x, turkey.y - this.y);
    const caught = this.state === 'chase' && dist < this.cfg.catchRadius && !turkey.invulnerable;
    return { seen, caught, dist };
  }
}

// The patrolling carving knife: slides back and forth along a straight line.
export class CarvingKnife {
  constructor(def) {
    const a = tileCenter({ x: def.from[0], y: def.from[1] });
    const b = tileCenter({ x: def.to[0], y: def.to[1] });
    this.ax = a.x;
    this.ay = a.y;
    this.bx = b.x;
    this.by = b.y;
    this.t = 0;
    this.dir = 1;
    this.speed = def.speed || 1;
    this.x = a.x;
    this.y = a.y;
    this.angle = Math.atan2(b.y - a.y, b.x - a.x);
  }

  update(dt) {
    const len = Math.hypot(this.bx - this.ax, this.by - this.ay);
    this.t += (this.dir * 130 * this.speed * dt) / len;
    if (this.t >= 1) {
      this.t = 1;
      this.dir = -1;
    }
    if (this.t <= 0) {
      this.t = 0;
      this.dir = 1;
    }
    this.x = this.ax + (this.bx - this.ax) * this.t;
    this.y = this.ay + (this.by - this.ay) * this.t;
  }
}
