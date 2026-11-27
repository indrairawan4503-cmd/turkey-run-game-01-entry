// Thanksgiving Heist — game state, the main loop, scoring and stage flow.
// One job: run the heist from title screen to escape or capture.
import { VIEW_W, VIEW_H, GAME, TILE } from './config.js';
import { STAGES, tileCenter } from './stages.js';
import { Turkey } from './turkey.js';
import { Patroller, CarvingKnife } from './farmer.js';
import { knifeHitsTurkey, ovenBurned } from './hazards.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const renderer = new Renderer(canvas);
const sounds = new SoundBank();
const input = new Input();
const statusEl = document.getElementById('status');

const game = {
  screen: 'title', // title | play | paused | end
  stageIndex: 0,
  turkey: null,
  patrollers: [],
  knives: [],
  keys: 0,
  lives: GAME.lives,
  score: 0,
  elapsed: 0,
  timesSpotted: 0,
  spottedFlag: false,
  won: false,
  endReason: '',
  bestScore: 0,
  banner: null,
  bannerUntil: 0,
  _wasChasing: false,
  get timeText() {
    const m = Math.floor(this.elapsed / 60);
    const s = Math.floor(this.elapsed % 60);
    return m + ':' + String(s).padStart(2, '0');
  },
};

// Debug/test handle: lets a play-test read the live game state.
window.__game = game;

function loadStage(index) {
  const stage = STAGES[index];
  stage.keyTaken = false;
  game.stageIndex = index;
  game.turkey = new Turkey(index);
  game.patrollers = [
    ...stage.farmers.map((f) => new Patroller('farmer', f)),
    ...stage.dogs.map((d) => new Patroller('dog', d)),
  ];
  game.knives = stage.knives.map((k) => new CarvingKnife(k));
  game.banner = { text: stage.name, sub: stage.subtitle, color: '#ffd23e' };
  game.bannerUntil = performance.now() + 2400;
  game.spottedFlag = false;
  game._wasChasing = false;
  setStatus(stage.name + '. ' + stage.subtitle);
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function startGame() {
  game.screen = 'play';
  game.keys = 0;
  game.lives = GAME.lives;
  game.score = 0;
  game.elapsed = 0;
  game.timesSpotted = 0;
  game.won = false;
  game.endReason = '';
  loadStage(0);
  sounds.ensure();
  sounds.startMusic();
  sounds.gobble();
}

function loseLife(reason) {
  game.lives -= 1;
  sounds.hurt();
  if (game.lives <= 0) {
    endGame(false, reason);
    return;
  }
  const stage = STAGES[game.stageIndex];
  const c = tileCenter(stage.start);
  game.turkey.x = c.x;
  game.turkey.y = c.y;
  game.turkey.heat = 0;
  game.turkey.noise = 0;
  game.turkey.invulnerableUntil = performance.now() + GAME.invulnerableTime * 1000;
  for (const p of game.patrollers) {
    p.state = 'patrol';
    p.detect = 0;
    p.lastSeen = null;
  }
  game.banner = { text: 'OUCH! ' + reason, sub: game.lives + (game.lives === 1 ? ' life' : ' lives') + ' left — back to the start of this stage', color: '#ff5a6e' };
  game.bannerUntil = performance.now() + 2000;
  setStatus(reason + '. ' + game.lives + ' lives left.');
}

function nextStage() {
  game.score += GAME.stageScore;
  if (game.stageIndex + 1 >= STAGES.length) {
    endGame(true, '');
    return;
  }
  loadStage(game.stageIndex + 1);
  sounds.door();
}

function endGame(won, reason) {
  game.screen = 'end';
  game.won = won;
  game.endReason = reason;
  if (won) {
    const timeBonus = Math.max(0, GAME.winTimeBonusBase - Math.floor(game.elapsed) * GAME.winTimeBonusPerSec);
    game.score += timeBonus;
    if (game.timesSpotted === 0) game.score += GAME.stealthBonus;
    sounds.win();
    setStatus('Escaped! Score ' + game.score + '.');
  } else {
    sounds.lose();
    setStatus('Caught. Score ' + game.score + '.');
  }
  game.bestScore = Math.max(game.bestScore, game.score);
  try {
    const best = Number(localStorage.getItem('thanksgiving-heist-best') || 0);
    game.bestScore = Math.max(best, game.score);
    localStorage.setItem('thanksgiving-heist-best', String(game.bestScore));
  } catch (e) {
    // Storage may be unavailable; the in-memory best still shows.
  }
  sounds.stopMusic();
}

function updatePlay(dt) {
  const stage = STAGES[game.stageIndex];
  const turkey = game.turkey;
  game.elapsed += dt;

  turkey.update(dt, input, stage, performance.now());

  // Corn key pickup.
  if (!stage.keyTaken) {
    const d = Math.hypot(turkey.x - (stage.key.x + 0.5) * TILE, turkey.y - (stage.key.y + 0.5) * TILE);
    if (d < 26) {
      stage.keyTaken = true;
      game.keys += 1;
      game.score += GAME.keyScore;
      sounds.key();
      game.banner = { text: 'CORN KEY ' + game.keys + '/3!', sub: 'The door is unlocked — slip through when the coast is clear', color: '#ffd23e' };
      game.bannerUntil = performance.now() + 1800;
      setStatus('Corn key ' + game.keys + ' of 3 collected.');
    }
  }

  // Door / back gate: only when this stage's key is taken (gate needs all 3).
  const doorOpen = stage.id === 'kitchen' ? game.keys >= GAME.keysToEscape : stage.keyTaken;
  if (doorOpen) {
    const d = Math.hypot(turkey.x - (stage.door.x + 0.5) * TILE, turkey.y - (stage.door.y + 0.5) * TILE);
    if (d < 26) {
      nextStage();
      return;
    }
  }

  // Patrollers: spot, chase, search — and catch.
  let anyChasing = false;
  for (const p of game.patrollers) {
    const res = p.update(dt, stage, turkey, performance.now());
    if (p.state === 'chase') {
      anyChasing = true;
      if (!game.spottedFlag) {
        game.spottedFlag = true;
        game.timesSpotted += 1;
        sounds.spotted();
        setStatus(p.kind === 'dog' ? 'The dog spotted you!' : 'The farmer spotted you! Hide!');
      }
    }
    if (res.caught) {
      loseLife(p.kind === 'dog' ? 'The farm dog ran you down!' : 'The farmer caught you!');
      return;
    }
  }
  if (!anyChasing) game.spottedFlag = false;
  game._wasChasing = anyChasing;

  // Carving knives.
  for (const k of game.knives) {
    k.update(dt);
    if (knifeHitsTurkey(k, turkey)) {
      loseLife('Sliced by the patrolling carving knife!');
      return;
    }
  }

  // Oven burn.
  if (ovenBurned(turkey)) {
    loseLife('Burned by the oven heat!');
    return;
  }

  if (game.banner && performance.now() > game.bannerUntil) game.banner = null;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  renderer.time += dt;

  if (input.wasPressed('enter') || input.wasPressed(' ')) {
    if (game.screen === 'title' || game.screen === 'end') {
      sounds.click();
      startGame();
    }
  }
  if (input.wasPressed('p') && game.screen === 'play') {
    game.screen = 'paused';
    setStatus('Paused.');
  } else if (input.wasPressed('p') && game.screen === 'paused') {
    game.screen = 'play';
    setStatus('Back to the heist.');
  }
  if (input.wasPressed('m')) {
    const muted = sounds.toggleMute();
    setStatus(muted ? 'Sound muted.' : 'Sound on.');
  }
  if (input.wasPressed('g')) sounds.gobble();

  if (game.screen === 'play') updatePlay(dt);

  renderer.clear();
  if (game.screen === 'title') renderer.drawTitle(game);
  else if (game.screen === 'end') renderer.drawEnd(game);
  else if (game.screen === 'paused') {
    renderer.drawPlay(game);
    renderer.drawPaused();
  } else {
    renderer.drawPlay(game);
  }
  requestAnimationFrame(frame);
}

// Deterministic screenshot hooks (?shot=start|play|kitchen|end).
// Positions are set exactly; no warm-up loop — the live loop runs only
// for the ~0.9 s before the shutter, so nothing gets caught mid-shot.
const params = new URLSearchParams(window.location.search);
if (params.has('shot')) {
  applyShot(params.get('shot'), game, { startGame, loadStage, endGame, loseLife }, sounds);
}

requestAnimationFrame(frame);
