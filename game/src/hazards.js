// Thanksgiving Heist — kitchen hazards: oven heat zones and the carving knife.
// One job: decide when a hazard actually hurts the turkey.
import { TILE, KNIFE } from './config.js';

export function turkeyInOven(stage, turkey) {
  for (const o of stage.ovens) {
    if (
      turkey.x >= o.x * TILE && turkey.x < (o.x + o.w) * TILE &&
      turkey.y >= o.y * TILE && turkey.y < (o.y + o.h) * TILE
    ) {
      return o;
    }
  }
  return null;
}

export function knifeHitsTurkey(knife, turkey) {
  if (turkey.invulnerable) return false;
  const d = Math.hypot(knife.x - turkey.x, knife.y - turkey.y);
  return d < KNIFE.radius + 12;
}

export function ovenBurned(turkey) {
  return turkey.heat >= 100;
}
