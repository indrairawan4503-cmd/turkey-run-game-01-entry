// Thanksgiving Heist — the three stages: farmyard, farmhouse, kitchen.
// One job: the layout of every room (walls, hides, keys, doors, patrols).
// Coordinates are tile units on a 24 x 16 grid; walls are [x, y, w, h] rects.
// Every wall list includes the border; the maps were hand-checked for gaps.

export const STAGES = [
  {
    id: 'yard',
    name: 'STAGE 1 — THE FARMYARD',
    subtitle: 'Dawn. Sneak past the farmer, grab the corn key, slip inside.',
    theme: 'yard',
    start: { x: 2, y: 2 },
    door: { x: 22, y: 13, label: 'FARMHOUSE DOOR' },
    key: { x: 20, y: 2 },
    walls: [
      [0, 0, 24, 1], [0, 15, 24, 1], [0, 0, 1, 16], [23, 0, 1, 16],
      [4, 3, 5, 4], // the red barn
      [15, 3, 4, 3], // the tool shed
      [3, 11, 4, 1], // fence run
      [16, 11, 4, 1], // fence run
      [10, 6, 2, 3], // wood pile
    ],
    hides: [
      { x: 8, y: 2, kind: 'hay' },
      { x: 18, y: 6, kind: 'hay' },
      { x: 6, y: 13, kind: 'hay' },
      { x: 12, y: 12, kind: 'hay' },
    ],
    farmers: [
      { waypoints: [[12, 2], [12, 13], [20, 13], [20, 2]], speed: 1 },
    ],
    dogs: [],
    knives: [],
    ovens: [],
    hint: 'Haystacks hide you. SHIFT runs — but running is LOUD.',
  },
  {
    id: 'house',
    name: 'STAGE 2 — THE FARMHOUSE',
    subtitle: 'Inside now. The dog hears everything. Mind the parlour.',
    theme: 'house',
    start: { x: 2, y: 13 },
    door: { x: 22, y: 2, label: 'KITCHEN DOOR' },
    key: { x: 21, y: 13 },
    walls: [
      [0, 0, 24, 1], [0, 15, 24, 1], [0, 0, 1, 16], [23, 0, 1, 16],
      [11, 1, 1, 5], // parlour divider (gap at y 6..7)
      [11, 8, 1, 7], // parlour divider lower half
      [4, 7, 7, 1], // hallway wall with a gap at x 11..12
      [16, 7, 7, 1], // hallway wall right half
      [17, 2, 3, 3], // dresser
      [5, 11, 4, 3], // dining table
    ],
    hides: [
      { x: 3, y: 3, kind: 'barrel' },
      { x: 18, y: 12, kind: 'barrel' },
      { x: 8, y: 13, kind: 'barrel' },
      { x: 20, y: 4, kind: 'hay' },
    ],
    farmers: [
      { waypoints: [[3, 3], [9, 3], [9, 6], [14, 6], [14, 9], [20, 9], [20, 12], [14, 12], [9, 12], [9, 9], [3, 9]], speed: 1.15 },
    ],
    dogs: [
      { waypoints: [[18, 9], [18, 13], [21, 13], [21, 9]], speed: 1 },
    ],
    knives: [],
    ovens: [],
    hint: 'Barrels hide you. The DOG sees less far but chases faster.',
  },
  {
    id: 'kitchen',
    name: 'STAGE 3 — THE KITCHEN',
    subtitle: 'The oven roars, the knife patrols. Grab the last key. RUN!',
    theme: 'kitchen',
    start: { x: 2, y: 13 },
    door: { x: 22, y: 2, label: 'BACK GATE — NEEDS 3 CORN KEYS' },
    key: { x: 21, y: 13 },
    walls: [
      [0, 0, 24, 1], [0, 15, 24, 1], [0, 0, 1, 16], [23, 0, 1, 16],
      [9, 2, 4, 2], // pantry counter
      [4, 6, 3, 2], // table
      [15, 9, 4, 2], // island counter
      [9, 12, 2, 2], // stool block
    ],
    hides: [
      { x: 5, y: 3, kind: 'barrel' },
      { x: 15, y: 13, kind: 'barrel' },
      { x: 12, y: 4, kind: 'hay' },
    ],
    farmers: [
      { waypoints: [[7, 9], [13, 9], [13, 12], [19, 12], [19, 4], [7, 4]], speed: 1.3 },
    ],
    dogs: [],
    knives: [
      { from: [8, 7], to: [18, 7], speed: 1.25 },
      { from: [13, 12], to: [13, 5], speed: 1.1, vertical: true },
    ],
    ovens: [
      { x: 17, y: 1, w: 4, h: 3, label: 'OVEN' },
      { x: 1, y: 10, w: 4, h: 3, label: 'STOVE' },
    ],
    hint: 'Oven heat BURNS — don\'t linger. The carving knife patrols!',
  },
];

// Tile helpers shared by the player, farmer and hazards.
export function tileCenter(t) {
  return { x: (t.x + 0.5) * 40, y: (t.y + 0.5) * 40 };
}

export function pointInWall(stage, px, py) {
  for (const [wx, wy, ww, wh] of stage.walls) {
    if (px >= wx * 40 && px < (wx + ww) * 40 && py >= wy * 40 && py < (wy + wh) * 40) return true;
  }
  return false;
}

// Circle-vs-walls test: true when a circle of radius r at (px,py) is clear.
export function circleClear(stage, px, py, r) {
  const x0 = Math.floor((px - r) / 40);
  const x1 = Math.floor((px + r) / 40);
  const y0 = Math.floor((py - r) / 40);
  const y1 = Math.floor((py + r) / 40);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= 24 || ty >= 16) return false;
      if (pointInWall(stage, tx * 40 + 20, ty * 40 + 20)) {
        // wall tile: check the circle against the tile rect properly
        const rx = Math.max(tx * 40, Math.min(px, tx * 40 + 40));
        const ry = Math.max(ty * 40, Math.min(py, ty * 40 + 40));
        const dx = px - rx;
        const dy = py - ry;
        if (dx * dx + dy * dy < r * r) return false;
      }
    }
  }
  return true;
}

// Straight line of sight between two points, blocked only by walls.
export function lineOfSight(stage, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 12));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInWall(stage, ax + dx * t, ay + dy * t)) return false;
  }
  return true;
}

export function stageTheme(stage) {
  return stage.theme;
}
