# turkey-run-game-01-entry

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/indrairawan4503-cmd/turkey-run-game-01-entry/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/indrairawan4503-cmd/turkey-run-game-01-entry/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving Heist — a top-down stealth turkey escape game: sneak past the farmer, dodge the oven and the patrolling carving knives, collect 3 corn keys, and slip out the back gate before you become Thanksgiving dinner.

## Run it

```sh
node serve.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=8dxq9bq0&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit
http://localhost:8080). No network, no build step.

- **WASD / arrow keys** — move (sneak)
- **SHIFT** — run (fast, but LOUD: the noise meter fills and the farmer investigates)
- **Stand still in hay or barrels** — hide (the farmer cannot see you)
- **P** — pause, **M** — mute, **G** — gobble, **ENTER** — start / restart

## The heist

1. **Stage 1 — The Farmyard:** grab the first corn key past the patrolling farmer.
2. **Stage 2 — The Farmhouse:** the farm dog hears everything and chases faster.
3. **Stage 3 — The Kitchen:** the oven burns, two carving knives patrol — grab the
   last key and escape out the back gate.

The farmer patrols, gets suspicious, chases, and searches your last known
position. Get caught, sliced or burned 3 times and dinner is on. Escape with a
time bonus and a stealth bonus for never being spotted.

## Files

- `game/index.html` — the page; `game/src/main.js` — state machine and loop
- `game/src/config.js` — constants and palette
- `game/src/stages.js` — the three stage maps
- `game/src/turkey.js` — movement, noise and hiding
- `game/src/farmer.js` — farmer/dog AI (patrol, spot, chase, search) and the knife
- `game/src/hazards.js` — oven and knife hit tests
- `game/src/render.js` — all canvas art, HUD, title and end screens
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/input.js` — keyboard input
- `game/src/shots.js` — deterministic screenshot states (`?shot=...`)
- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes `dossier.json`)

## License

MIT — see `LICENSE`.
