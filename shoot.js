// Screenshot driver for Thanksgiving Heist (variant B).
// Serves game/ via the entry's own serve.ts, opens each ?shot= state in
// headless Chromium (playwright-core, cached chromium-1255), and writes
// JPEGs into screenshots/. Exits non-zero on any page error.
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = '/home/hatch/workspace/makefun/turkey-run-game-01-entry-b';
const SHOTS = JSON.parse(fs.readFileSync(path.join(DIR, 'shots.json'), 'utf8'));
const PORT = 8091;
const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';

async function main() {
  const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: DIR, stdio: 'pipe' });
  server.stderr.on('data', (d) => console.log('[server]', d.toString().trim()));
  server.on('exit', (code) => console.log('[server] exited', code));
  // Wait until the server actually answers.
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`);
      if (res.ok) break;
    } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
      page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url()));
      page.on('response', (r) => { if (r.status() >= 400) errors.push('http' + r.status() + ': ' + r.url()); });
      await page.goto(`http://127.0.0.1:${PORT}/${shot.query}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const out = path.join(DIR, 'screenshots', shot.name);
      await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
      const st = fs.statSync(out);
      console.log(shot.name, st.size, 'bytes', errors.length ? 'ERRORS: ' + errors.join(' | ') : 'clean');
      if (errors.length) process.exitCode = 1;
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
