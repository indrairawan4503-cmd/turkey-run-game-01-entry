// Real play-test for Thanksgiving Heist (variant B): drives the game with the
// keyboard and the window.__game handle and asserts the core loop works:
// start, move, hide, key pickup, stage advance, farmer chase, caught, escape.
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');

const DIR = '/home/hatch/workspace/makefun/turkey-run-game-01-entry-b';
const PORT = 8092;
const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';

let failures = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail !== undefined ? ' — ' + detail : ''));
  if (!ok) failures += 1;
}

async function main() {
  const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: DIR, stdio: 'pipe' });
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/`); if (r.ok) break; } catch (e) {}
    await new Promise((r) => setTimeout(r, 300));
  }
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const state = (expr) => page.evaluate(expr);

    check('title screen', (await state(() => window.__game.screen)) === 'title');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    check('Enter starts play', (await state(() => window.__game.screen)) === 'play');
    check('stage 0 loaded', (await state(() => window.__game.stageIndex)) === 0);
    check('3 lives', (await state(() => window.__game.lives)) === 3);

    // Movement: hold right, turkey x must grow.
    const x0 = await state(() => window.__game.turkey.x);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(700);
    await page.keyboard.up('ArrowRight');
    const x1 = await state(() => window.__game.turkey.x);
    check('turkey moves right', x1 > x0 + 40, `x ${Math.round(x0)} -> ${Math.round(x1)}`);

    // Running makes noise.
    await page.keyboard.down('Shift');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(900);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('Shift');
    const noise = await state(() => window.__game.turkey.noise);
    check('running builds noise', noise > 20, 'noise=' + Math.round(noise));

    // Hiding: put the turkey on a haystack and stand still.
    await state(() => {
      const g = window.__game;
      g.turkey.x = 8 * 40 + 20; g.turkey.y = 2 * 40 + 20; g.turkey.noise = 0;
    });
    await page.waitForTimeout(400);
    check('hidden on haystack', await state(() => window.__game.turkey.hidden) === true);

    // Key pickup: put the turkey on the stage-1 key.
    await state(() => {
      const g = window.__game;
      g.turkey.x = 20 * 40 + 20; g.turkey.y = 2 * 40 + 20;
    });
    await page.waitForTimeout(400);
    check('key collected', (await state(() => window.__game.keys)) === 1);
    check('score for key', (await state(() => window.__game.score)) >= 500);

    // Door: with the key taken, stepping on the door advances the stage.
    await state(() => {
      const g = window.__game;
      g.turkey.x = 22 * 40 + 20; g.turkey.y = 13 * 40 + 20;
    });
    await page.waitForTimeout(400);
    check('door advances to stage 2', (await state(() => window.__game.stageIndex)) === 1);
    check('dog exists in house', (await state(() => window.__game.patrollers.some((p) => p.kind === 'dog'))) === true);

    // Farmer chase: put the farmer next to the turkey, facing it.
    await state(() => {
      const g = window.__game;
      const p = g.patrollers[0];
      p.x = g.turkey.x + 60; p.y = g.turkey.y;
      p.facing = Math.PI; p.state = 'patrol'; p.detect = 0.9;
    });
    await page.waitForTimeout(1200);
    check('farmer chases when he sees you', (await state(() => window.__game.patrollers[0].state)) === 'chase');

    // Caught: last life, farmer on top of the turkey, no invulnerability.
    await state(() => {
      const g = window.__game;
      g.lives = 1;
      g.turkey.invulnerableUntil = 0;
      const p = g.patrollers[0];
      p.x = g.turkey.x; p.y = g.turkey.y; p.state = 'chase'; p.detect = 1;
    });
    await page.waitForTimeout(1200);
    check('caught ends the game', (await state(() => window.__game.screen)) === 'end');
    check('caught, not escaped', (await state(() => window.__game.won)) === false);

    // Restart and win: jump to the kitchen with 3 keys, step on the gate.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await state(() => {
      const g = window.__game;
      g.keys = 3;
      g.stageIndex = 2;
      // Rebuild stage-3 actors the way loadStage does (via a fresh start is
      // simpler: reload the page state through the shot hook instead).
    });
    // Use the kitchen shot hook for a clean stage-3 state, then walk to the gate.
    await page.goto(`http://127.0.0.1:${PORT}/?shot=kitchen`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await state(() => {
      const g = window.__game;
      g.keys = 3;
      g.turkey.x = 22 * 40 + 20; g.turkey.y = 2 * 40 + 20;
      // Keep the farmer far away so the gate step is not interrupted.
      for (const p of g.patrollers) { p.x = 2 * 40 + 20; p.y = 13 * 40 + 20; p.state = 'patrol'; p.detect = 0; }
    });
    await page.waitForTimeout(500);
    check('gate escapes the game', (await state(() => window.__game.screen)) === 'end');
    check('escaped = won', (await state(() => window.__game.won)) === true);

    // Restart from the end screen.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    check('Enter restarts after end', (await state(() => window.__game.screen)) === 'play');

    check('no page errors', errors.length === 0, errors.join(' | '));
    console.log(failures === 0 ? 'ALL PLAY-TESTS PASSED' : failures + ' FAILURES');
    process.exitCode = failures === 0 ? 0 : 1;
  } finally {
    await browser.close();
    server.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
