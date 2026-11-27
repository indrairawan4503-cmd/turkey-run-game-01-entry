// Thanksgiving Heist — all canvas drawing: farm, farmhouse, kitchen, turkey,
// farmer, dog, knife, HUD, title and end screens. One job: make it readable
// at a glance. All art is drawn in code; no image files.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, PALETTE as P, GAME, FARMER } from './config.js';
import { STAGES } from './stages.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
  }

  clear() {
    this.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  }

  // ---------- floors and walls ----------

  drawFloor(stage) {
    const ctx = this.ctx;
    if (stage.theme === 'yard') {
      ctx.fillStyle = P.yardGrass;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      // Mown stripes.
      for (let x = 0; x < COLS; x += 2) {
        ctx.fillStyle = P.yardGrassDark;
        ctx.fillRect(x * TILE, 0, TILE, VIEW_H);
      }
      // Dirt path from the start to the door.
      ctx.fillStyle = P.yardDirt;
      ctx.fillRect(2 * TILE, 2 * TILE, TILE, 11 * TILE);
      ctx.fillRect(2 * TILE, 12 * TILE, 20 * TILE, TILE);
      ctx.fillRect(21 * TILE, 2 * TILE, TILE, 11 * TILE);
    } else if (stage.theme === 'house') {
      ctx.fillStyle = P.houseFloor;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = P.houseFloorDark;
      for (let y = 0; y < ROWS; y += 2) ctx.fillRect(0, y * TILE, VIEW_W, 4);
      for (let x = 0; x < COLS; x++) {
        ctx.fillRect(x * TILE, 0, 2, VIEW_H);
      }
      // Parlour rug.
      ctx.fillStyle = '#a33327';
      ctx.fillRect(13 * TILE, 9 * TILE, 8 * TILE, 5 * TILE);
      ctx.strokeStyle = '#e8c33c';
      ctx.lineWidth = 3;
      ctx.strokeRect(13 * TILE + 8, 9 * TILE + 8, 8 * TILE - 16, 5 * TILE - 16);
    } else {
      // Kitchen checkerboard.
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? P.kitchenFloor : P.kitchenFloorDark;
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
  }

  drawWalls(stage) {
    const ctx = this.ctx;
    for (const [wx, wy, ww, wh] of stage.walls) {
      const x = wx * TILE;
      const y = wy * TILE;
      const w = ww * TILE;
      const h = wh * TILE;
      const isBorder = wx === 0 || wy === 0 || wx + ww >= COLS || wy + wh >= ROWS;
      if (stage.theme === 'yard') {
        ctx.fillStyle = isBorder ? P.fence : P.wallWood;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = P.wallWoodTop;
        ctx.fillRect(x, y, w, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < w; i += 40) ctx.fillRect(x + i, y, 3, h);
      } else if (stage.theme === 'house') {
        ctx.fillStyle = P.wallWood;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = P.wallWoodTop;
        ctx.fillRect(x, y, w, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x, y + h - 6, w, 6);
      } else {
        ctx.fillStyle = '#8a4a3a';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#a85a48';
        ctx.fillRect(x, y, w, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let i = 0; i < w; i += 20) ctx.fillRect(x + i, y, 2, h);
      }
    }
  }

  // ---------- props ----------

  drawHaystack(x, y) {
    const ctx = this.ctx;
    const cx = x * TILE + TILE / 2;
    const by = y * TILE + TILE - 4;
    ctx.fillStyle = P.hayDark;
    ctx.beginPath();
    ctx.moveTo(cx - 17, by);
    ctx.lineTo(cx, by - 26);
    ctx.lineTo(cx + 17, by);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.hay;
    ctx.beginPath();
    ctx.moveTo(cx - 13, by - 2);
    ctx.lineTo(cx, by - 22);
    ctx.lineTo(cx + 13, by - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = P.hayDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, by - 4);
    ctx.lineTo(cx - 2, by - 16);
    ctx.moveTo(cx + 6, by - 4);
    ctx.lineTo(cx + 2, by - 16);
    ctx.stroke();
  }

  drawBarrel(x, y) {
    const ctx = this.ctx;
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    ctx.fillStyle = P.barrel;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a30';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 12, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6, 14, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 7, 14, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawCornKey(x, y, pulse) {
    const ctx = this.ctx;
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    const bob = Math.sin(this.time * 3 + x) * 3;
    const glow = 10 + Math.sin(pulse * 4) * 4;
    ctx.save();
    ctx.shadowColor = '#ffd23e';
    ctx.shadowBlur = glow;
    ctx.fillStyle = P.corn;
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, 9, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#e8a91c';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(cx + i * 5 - 1, cy + bob - 11, 2, 22);
    }
    ctx.fillStyle = P.cornHusk;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy + bob + 8);
    ctx.lineTo(cx - 16, cy + bob + 18);
    ctx.lineTo(cx - 4, cy + bob + 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 9, cy + bob + 8);
    ctx.lineTo(cx + 16, cy + bob + 18);
    ctx.lineTo(cx + 4, cy + bob + 12);
    ctx.closePath();
    ctx.fill();
  }

  drawDoor(stage, keysCollected) {
    const ctx = this.ctx;
    const d = stage.door;
    const cx = d.x * TILE + TILE / 2;
    const cy = d.y * TILE + TILE / 2;
    const isGate = stage.id === 'kitchen';
    const open = isGate ? keysCollected >= GAME.keysToEscape : keysCollected > 0 && stage.keyTaken;
    ctx.fillStyle = open ? '#4e9a3d' : P.gateWood;
    ctx.fillRect(d.x * TILE + 4, d.y * TILE + 2, TILE - 8, TILE - 4);
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 3;
    ctx.strokeRect(d.x * TILE + 4, d.y * TILE + 2, TILE - 8, TILE - 4);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.arc(cx + 10, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    if (!open) {
      // Padlock.
      ctx.fillStyle = '#dfe6ee';
      ctx.fillRect(cx - 7, cy - 4, 14, 11);
      ctx.strokeStyle = '#5c5c66';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 7, cy - 4, 14, 11);
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 5, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OPEN', cx, cy - 14);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isGate ? 'GATE' : 'DOOR', cx, d.y * TILE - 4);
  }

  drawOven(o) {
    const ctx = this.ctx;
    const x = o.x * TILE;
    const y = o.y * TILE;
    const w = o.w * TILE;
    const h = o.h * TILE;
    // Heat zone glow on the floor.
    const flicker = 0.25 + Math.sin(this.time * 6) * 0.08;
    ctx.fillStyle = `rgba(255, 90, 20, ${flicker})`;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.ovenBody;
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(x + 10, y + h - 16, w - 20, 10);
    // Fire mouth.
    ctx.fillStyle = P.ovenGlow;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 4, h / 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 7, h / 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT! ' + o.label, x + w / 2, y - 4);
  }

  // ---------- characters ----------

  drawVisionCone(p) {
    const ctx = this.ctx;
    const range = p.cfg.visionRange;
    const half = p.cfg.visionHalfAngle;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, range, p.facing - half, p.facing + half);
    ctx.closePath();
    ctx.fillStyle = p.state === 'chase' ? P.alertRed : P.alertYellow;
    ctx.fill();
    ctx.restore();
  }

  drawFarmer(p) {
    const ctx = this.ctx;
    this.drawVisionCone(p);
    const bob = p.state === 'patrol' ? Math.sin(this.time * 6) * 1.5 : 0;
    // Body: overalls.
    ctx.fillStyle = P.farmerOveralls;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 4 + bob, 15, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shirt sleeves.
    ctx.fillStyle = P.farmerShirt;
    ctx.beginPath();
    ctx.arc(p.x - 13, p.y + bob, 6, 0, Math.PI * 2);
    ctx.arc(p.x + 13, p.y + bob, 6, 0, Math.PI * 2);
    ctx.fill();
    // Head.
    ctx.fillStyle = P.farmerSkin;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 12 + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    // Straw hat.
    ctx.fillStyle = P.farmerHat;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 18 + bob, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y - 19 + bob, 8, Math.PI, 0);
    ctx.fill();
    // Eyes look where he faces.
    ctx.fillStyle = '#1a1a1a';
    const ex = Math.cos(p.facing) * 3;
    const ey = Math.sin(p.facing) * 2;
    ctx.beginPath();
    ctx.arc(p.x - 3 + ex, p.y - 13 + ey + bob, 1.6, 0, Math.PI * 2);
    ctx.arc(p.x + 3 + ex, p.y - 13 + ey + bob, 1.6, 0, Math.PI * 2);
    ctx.fill();
    // State marker.
    if (p.state === 'chase') {
      ctx.fillStyle = '#ff3c28';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', p.x, p.y - 30 + bob);
    } else if (p.state === 'search') {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', p.x, p.y - 30 + bob);
    }
    // Detection meter above the farmer.
    if (p.detect > 0.05 && p.state !== 'chase') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(p.x - 16, p.y - 40, 32, 6);
      ctx.fillStyle = p.detect > 0.6 ? '#ff3c28' : '#ffd23e';
      ctx.fillRect(p.x - 15, p.y - 39, 30 * p.detect, 4);
    }
  }

  drawDog(p) {
    const ctx = this.ctx;
    this.drawVisionCone(p);
    const wag = Math.sin(this.time * 10) * 4;
    ctx.fillStyle = P.dogBody;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head in facing direction.
    const hx = p.x + Math.cos(p.facing) * 16;
    const hy = p.y + Math.sin(p.facing) * 12;
    ctx.beginPath();
    ctx.arc(hx, hy - 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6e4520';
    ctx.beginPath();
    ctx.ellipse(hx + Math.cos(p.facing) * 7, hy, 5, 3.5, p.facing, 0, Math.PI * 2);
    ctx.fill();
    // Ear + tail.
    ctx.fillStyle = '#6e4520';
    ctx.beginPath();
    ctx.arc(hx - 3, hy - 7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.dogBody;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x - Math.cos(p.facing) * 14, p.y);
    ctx.lineTo(p.x - Math.cos(p.facing) * 20, p.y - 6 + wag);
    ctx.stroke();
    if (p.state === 'chase') {
      ctx.fillStyle = '#ff3c28';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WOOF!', p.x, p.y - 22);
    }
  }

  drawKnife(k) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.angle + (k.dir > 0 ? 0 : Math.PI));
    // Danger glow.
    ctx.fillStyle = 'rgba(255, 60, 40, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    // Blade.
    ctx.fillStyle = P.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(18, -5);
    ctx.lineTo(-14, -5);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-14, 5);
    ctx.lineTo(18, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a97a8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Handle.
    ctx.fillStyle = P.knifeHandle;
    ctx.fillRect(18, -6, 10, 12);
    ctx.restore();
    ctx.fillStyle = '#ff3c28';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CARVING KNIFE', k.x, k.y - 28);
  }

  drawTurkey(t, stage) {
    const ctx = this.ctx;
    // Hidden: the turkey peeks out of the hay / barrel.
    if (t.hidden) {
      const spot = t.isHiddenSpot(stage);
      if (spot && spot.kind === 'hay') this.drawHaystack(spot.x, spot.y);
      if (spot && spot.kind === 'barrel') this.drawBarrel(spot.x, spot.y);
      // Just eyes and a beak peeking out.
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(t.x - 4, t.y - 4, 3, 0, Math.PI * 2);
      ctx.arc(t.x + 4, t.y - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(t.x - 4, t.y - 4, 1.5, 0, Math.PI * 2);
      ctx.arc(t.x + 4, t.y - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = P.turkeyWattle;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDDEN — shhh!', t.x, t.y - 26);
      return;
    }
    const bob = t.moving ? Math.sin(t.stepPhase) * 2 : Math.sin(this.time * 2) * 1;
    const blink = t.invulnerable && Math.floor(this.time * 10) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.45;
    // Tail fan.
    const fx = Math.cos(Math.atan2(t.dirY, t.dirX) + Math.PI);
    const fy = Math.sin(Math.atan2(t.dirY, t.dirX) + Math.PI);
    ctx.fillStyle = P.turkeyTail;
    for (let i = -2; i <= 2; i++) {
      const a = Math.atan2(fy, fx) + i * 0.35;
      ctx.beginPath();
      ctx.ellipse(t.x + Math.cos(a) * 14, t.y + Math.sin(a) * 14 + bob, 5, 11, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Body.
    ctx.fillStyle = P.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + bob, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = P.turkeyWing;
    ctx.beginPath();
    ctx.ellipse(t.x - 4, t.y + 2 + bob, 7, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Head (toward movement).
    const hx = t.x + t.dirX * 11;
    const hy = t.y + t.dirY * 9 - 4 + bob;
    ctx.fillStyle = P.turkeyHead;
    ctx.beginPath();
    ctx.arc(hx, hy, 7.5, 0, Math.PI * 2);
    ctx.fill();
    // Beak + wattle.
    ctx.fillStyle = P.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(hx + t.dirX * 6, hy);
    ctx.lineTo(hx + t.dirX * 12, hy + 2);
    ctx.lineTo(hx + t.dirX * 6, hy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(hx + t.dirX * 3, hy + 6, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye.
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(hx + t.dirX * 2, hy - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Legs.
    ctx.strokeStyle = '#f2a007';
    ctx.lineWidth = 2;
    const lp = t.moving ? Math.sin(t.stepPhase) * 4 : 0;
    ctx.beginPath();
    ctx.moveTo(t.x - 5, t.y + 10 + bob);
    ctx.lineTo(t.x - 5 + lp, t.y + 15);
    ctx.moveTo(t.x + 5, t.y + 10 + bob);
    ctx.lineTo(t.x + 5 - lp, t.y + 15);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---------- HUD and screens ----------

  drawHud(game) {
    const ctx = this.ctx;
    const stage = STAGES[game.stageIndex];
    ctx.fillStyle = P.hudBg;
    ctx.fillRect(0, 0, VIEW_W, 56);
    // Second HUD row (lives / score / noise / heat) sits over the playfield,
    // so it gets its own translucent strip for contrast on light floors.
    ctx.fillStyle = 'rgba(20, 14, 8, 0.5)';
    ctx.fillRect(0, 56, VIEW_W, 44);
    ctx.fillStyle = P.hudText;
    ctx.textAlign = 'left';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(stage.name, 12, 24);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#d8c9a8';
    ctx.fillText(stage.subtitle, 12, 44);
    // Keys.
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = P.hudText;
    let kx = VIEW_W - 12;
    for (let i = 0; i < GAME.keysToEscape; i++) {
      ctx.fillStyle = i < game.keys ? '#ffd23e' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(kx - 8, 20, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      kx -= 26;
    }
    ctx.fillStyle = P.hudText;
    ctx.fillText('CORN KEYS ' + game.keys + '/' + GAME.keysToEscape, kx - 6, 25);
    // Lives.
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px sans-serif';
    let hearts = '';
    for (let i = 0; i < GAME.lives; i++) hearts += i < game.lives ? '♥ ' : '♡ ';
    ctx.fillStyle = '#ff5a6e';
    ctx.fillText(hearts, 12, 76);
    ctx.fillStyle = P.hudText;
    ctx.font = '13px sans-serif';
    ctx.fillText('SCORE ' + game.score + '   TIME ' + game.timeText, 120, 76);
    // Noise meter.
    const nx = VIEW_W - 260;
    const ny = 66;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(nx, ny, 150, 12);
    ctx.fillStyle = game.turkey.noise > 62 ? '#ff3c28' : game.turkey.noise > 30 ? '#ffd23e' : '#4e9a3d';
    ctx.fillRect(nx + 1, ny + 1, 148 * (game.turkey.noise / 100), 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('NOISE', nx - 46, ny + 10);
    if (game.turkey.noise > 62) {
      ctx.fillStyle = '#ff3c28';
      ctx.fillText('TOO LOUD!', nx + 156, ny + 10);
    }
    // Heat meter (kitchen).
    if (stage.theme === 'kitchen') {
      const hx = VIEW_W - 260;
      const hy = 84;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(hx, hy, 150, 12);
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(hx + 1, hy + 1, 148 * (game.turkey.heat / 100), 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('HEAT', hx - 40, hy + 10);
    }
    // Stage hint at the bottom.
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stage.hint + '   •   WASD/arrows move · SHIFT run · P pause · M mute', VIEW_W / 2, VIEW_H - 8);
  }

  drawBanner(text, sub, color) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, VIEW_H / 2 - 70, VIEW_W, 110);
    ctx.fillStyle = color || '#ffd23e';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, VIEW_W / 2, VIEW_H / 2 - 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText(sub, VIEW_W / 2, VIEW_H / 2 + 24);
  }

  drawTitle(game) {
    const ctx = this.ctx;
    // Warm autumn backdrop.
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, '#3a2410');
    grad.addColorStop(0.55, '#7a4a21');
    grad.addColorStop(1, '#2a1608');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Falling leaves.
    for (let i = 0; i < 26; i++) {
      const lx = (i * 97 + this.time * 22) % VIEW_W;
      const ly = (i * 61 + this.time * 34) % VIEW_H;
      ctx.fillStyle = i % 3 === 0 ? '#e8a91c' : i % 3 === 1 ? '#c0392b' : '#e8c33c';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 7, 4, 0.6 + i, 0, Math.PI * 2);
      ctx.fill();
    }
    // Big turkey portrait.
    const cx = VIEW_W / 2;
    const cy = 300;
    ctx.fillStyle = P.turkeyTail;
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.32;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * 78, cy + Math.sin(a) * 78, 16, 42, a + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = P.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20, 72, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.turkeyHead;
    ctx.beginPath();
    ctx.arc(cx, cy - 52, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 50);
    ctx.lineTo(cx + 34, cy - 42);
    ctx.lineTo(cx - 8, cy - 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy - 28, 9, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - 12, cy - 58, 5, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy - 58, 5, 0, Math.PI * 2);
    ctx.fill();
    // Title text.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText('THANKSGIVING HEIST', cx, 96);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('A turkey stealth escape — outwit the farmer, dodge the knife,', cx, 132);
    ctx.fillText('beat the oven, and slip out the back gate before dinner.', cx, 160);
    // Controls card.
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cx - 330, 452, 660, 108);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '16px sans-serif';
    ctx.fillText('WASD / ARROWS — sneak & run      SHIFT — run (LOUD!)', cx, 482);
    ctx.fillText('Stand still in hay or barrels to HIDE      Collect 3 corn keys', cx, 508);
    ctx.fillText('Farmer patrols with a vision cone — don\'t let him see you!', cx, 534);
    const blink = Math.floor(this.time * 1.6) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('▶  PRESS ENTER TO START THE HEIST  ◀', cx, 600);
    }
    ctx.fillStyle = '#d8c9a8';
    ctx.font = '13px sans-serif';
    ctx.fillText('3 stages: the farmyard · the farmhouse · the kitchen   •   3 lives   •   sound on (M to mute)', cx, 626);
  }

  // End screen backdrop: the live game scene, staged for the outcome and
  // dimmed, so the panel reads as a real game-over screen over the world.
  // Escaped: the turkey at the back gate (kitchen stage) with the farmer
  // a step behind. Caught: the farmer right on top of the turkey, grabbing
  // it. Characters are staged props (plain objects, not live game state)
  // placed in the open margins beside the text panel.
  drawEndScene(game) {
    const ctx = this.ctx;
    const won = game.won;
    const stage = won ? STAGES[2] : STAGES[game.stageIndex];
    this.drawFloor(stage);
    for (const o of stage.ovens) this.drawOven(o);
    this.drawDoor(stage, won ? GAME.keysToEscape : game.keys);
    for (const h of stage.hides) {
      if (h.kind === 'hay') this.drawHaystack(h.x, h.y);
      else this.drawBarrel(h.x, h.y);
    }
    this.drawWalls(stage);
    if (won) {
      // Two carving knives glinting in the kitchen margins.
      this.drawKnife({ x: 2.5 * TILE, y: 5.5 * TILE, angle: 0, dir: 1 });
      this.drawKnife({ x: 2.5 * TILE, y: 13.5 * TILE, angle: Math.PI / 2, dir: 1 });
      // Turkey just below the open back gate (clear of the GATE label),
      // farmer a step behind in hot pursuit.
      this.drawTurkey({ x: 22.5 * TILE, y: 3.5 * TILE, dirX: 1, dirY: 0, hidden: false, moving: false, stepPhase: 0, invulnerable: false }, stage);
      this.drawFarmer({ x: 21.5 * TILE, y: 4.5 * TILE, facing: Math.atan2(3.5 * TILE - 4.5 * TILE, 22.5 * TILE - 21.5 * TILE), state: 'chase', detect: 0, cfg: FARMER });
    } else {
      // Farmer grabbing the turkey on open ground at the left margin.
      this.drawTurkey({ x: 1.5 * TILE, y: 8.5 * TILE, dirX: -1, dirY: 0, hidden: false, moving: false, stepPhase: 0, invulnerable: false }, stage);
      this.drawFarmer({ x: 2.5 * TILE, y: 8.5 * TILE, facing: Math.PI, state: 'chase', detect: 0, cfg: FARMER });
    }
    // Dim the scene so the panel text stays readable.
    ctx.fillStyle = 'rgba(8, 10, 6, 0.5)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawEnd(game) {
    const ctx = this.ctx;
    const won = game.won;
    this.drawEndScene(game);
    // Translucent panel behind the text; the scene ghosts through it.
    ctx.fillStyle = won ? 'rgba(12, 40, 12, 0.62)' : 'rgba(40, 8, 8, 0.62)';
    ctx.fillRect(110, 130, VIEW_W - 220, 425);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#ffd23e' : '#ff5a6e';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(won ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 180);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    if (won) {
      ctx.fillText('The turkey slipped out the back gate —', VIEW_W / 2, 228);
      ctx.fillText('Thanksgiving dinner is CANCELLED. Gobble gobble!', VIEW_W / 2, 258);
    } else {
      ctx.fillText(game.endReason || 'The farmer caught you.', VIEW_W / 2, 228);
      ctx.fillText('Thanksgiving dinner is ON. The turkey is the menu.', VIEW_W / 2, 258);
    }
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '20px sans-serif';
    ctx.fillText('SCORE  ' + game.score, VIEW_W / 2, 320);
    ctx.fillText('TIME  ' + game.timeText + '     KEYS  ' + game.keys + '/3     SPOTTED  ' + game.timesSpotted + '×', VIEW_W / 2, 352);
    ctx.fillText('BEST  ' + game.bestScore, VIEW_W / 2, 384);
    const blink = Math.floor(this.time * 1.6) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('▶  PRESS ENTER TO RUN AGAIN  ◀', VIEW_W / 2, 460);
    }
    ctx.fillStyle = '#d8c9a8';
    ctx.font = '14px sans-serif';
    ctx.fillText('Tip: hide in hay and barrels, walk when the farmer looks your way, run only when his back is turned.', VIEW_W / 2, 520);
  }

  drawPaused() {
    this.drawBanner('PAUSED', 'Press P to keep sneaking', '#ffffff');
  }

  // Full frame for a play state.
  drawPlay(game) {
    const stage = STAGES[game.stageIndex];
    this.drawFloor(stage);
    for (const o of stage.ovens) this.drawOven(o);
    this.drawDoor(stage, game.keys);
    for (const h of stage.hides) {
      if (h.kind === 'hay') this.drawHaystack(h.x, h.y);
      else this.drawBarrel(h.x, h.y);
    }
    if (!stage.keyTaken) this.drawCornKey(stage.key.x, stage.key.y, this.time);
    this.drawWalls(stage);
    for (const k of game.knives) this.drawKnife(k);
    this.drawTurkey(game.turkey, stage);
    for (const p of game.patrollers) {
      if (p.kind === 'dog') this.drawDog(p);
      else this.drawFarmer(p);
    }
    this.drawHud(game);
    if (game.banner) {
      this.drawBanner(game.banner.text, game.banner.sub, game.banner.color);
    }
  }
}
