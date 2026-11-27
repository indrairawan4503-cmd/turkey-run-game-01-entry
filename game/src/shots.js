// Thanksgiving Heist — deterministic screenshot hooks (?shot=...).
// One job: put the game into an exact, readable state for each screenshot
// so the judge's contact sheet shows title, play, kitchen and end screens.
// No randomness: every shot is the same every time it loads.
import { TILE } from './config.js';

function placeTurkey(game, tx, ty) {
  game.turkey.x = (tx + 0.5) * TILE;
  game.turkey.y = (ty + 0.5) * TILE;
  game.turkey.dirX = -1;
  game.turkey.dirY = 0;
}

function placePatroller(game, index, tx, ty, state, detect, faceTx, faceTy) {
  const p = game.patrollers[index];
  if (!p) return;
  p.x = (tx + 0.5) * TILE;
  p.y = (ty + 0.5) * TILE;
  p.state = state;
  p.detect = detect;
  p.facing = Math.atan2((faceTy + 0.5) * TILE - p.y, (faceTx + 0.5) * TILE - p.x);
  p.lastSeen = { x: (faceTx + 0.5) * TILE, y: (faceTy + 0.5) * TILE };
  p.loseSightTimer = 0;
}

export function applyShot(shot, game, actions, sounds) {
  if (shot === 'start') {
    // Title screen: nothing to set, the loop draws it.
    return;
  }
  if (shot === 'play') {
    actions.startGame();
    game.score = 1250;
    game.elapsed = 47;
    game.timesSpotted = 1;
    // Turkey in open ground mid-yard, clearly visible, farmer closing in
    // from the west with his vision cone sweeping right onto the turkey.
    // Turkey (14,9) / farmer (9,9): 200px apart, open grass, no haystack
    // or wall between them; detect 0.5 so the farmer reaches chase just
    // before the shutter but stays ~70px short — no catch mid-shot.
    placeTurkey(game, 14, 9);
    game.turkey.noise = 55;
    game.turkey.running = true;
    placePatroller(game, 0, 9, 9, 'search', 0.5, 14, 9);
    game.turkey.dirX = -1;
    game.turkey.dirY = 0;
    game.banner = null;
    return;
  }
  if (shot === 'kitchen') {
    actions.startGame();
    actions.loadStage(2);
    game.keys = 2;
    game.score = 2100;
    game.elapsed = 128;
    game.timesSpotted = 2;
    // Turkey in the kitchen, knife sliding past, oven glowing, farmer near.
    placeTurkey(game, 10, 10);
    game.turkey.heat = 45;
    game.turkey.noise = 30;
    // Farmer far across the room, back turned: no catch before the shutter.
    placePatroller(game, 0, 19, 4, 'patrol', 0.3, 7, 4);
    if (game.knives[0]) {
      game.knives[0].t = 0.5;
      game.knives[0].x = game.knives[0].ax + (game.knives[0].bx - game.knives[0].ax) * 0.5;
      game.knives[0].y = game.knives[0].ay + (game.knives[0].by - game.knives[0].ay) * 0.5;
    }
    if (game.knives[1]) {
      game.knives[1].t = 0.85;
      game.knives[1].x = game.knives[1].ax + (game.knives[1].bx - game.knives[1].ax) * 0.85;
      game.knives[1].y = game.knives[1].ay + (game.knives[1].by - game.knives[1].ay) * 0.85;
    }
    game.banner = null;
    return;
  }
  if (shot === 'end') {
    actions.startGame();
    game.keys = 3;
    game.score = 3450;
    game.elapsed = 183;
    game.timesSpotted = 1;
    actions.endGame(true, '');
    return;
  }
  // Unknown ?shot value: fall back to the title screen.
}
