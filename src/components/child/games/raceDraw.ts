// Canvas renderer for the maths race. Everything is painted in code — layered parallax scenery
// with haze, shaded cars, lit coins, glow and particles — so it stays crisp at any size and
// needs no image files.
import { ROAD_Y, TRACK, VH, VW, type Ev, type Power, type Race, type Theme } from '@/lib/race/sim';
import { CARS, type CarKind, type CarModel } from '@/lib/race/cars';

const CAR_X = 210;                       // the car sits here; the world scrolls past it
const ROAD_H = 74;
type C2D = CanvasRenderingContext2D;

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number; g: number; glow: boolean }
export interface View {
  car: CarModel; rival: CarModel;
  tick: number; parts: Part[]; shake: number; flash: number;
  banner: { text: string; sub: string; color: string; ttl: number } | null;
}
export const newView = (car: CarModel = CARS[0], rival: CarModel = CARS[1]): View => ({ car, rival: { ...rival, color: '#e23b3b', accent: '#ffffff' }, tick: 0, parts: [], banner: null, shake: 0, flash: 0 });

// ── small helpers ───────────────────────────────────────────────────────────
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const wrap = (v: number, m: number) => ((v % m) + m) % m;
const rgb = (hex: string) => { const n = parseInt(hex.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
/** Blend two #rrggbb colours. */
function mix(a: string, b: string, t: number): string {
  const p = rgb(a), q = rgb(b);
  return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(',')})`;
}
const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
const darken = (c: string, t: number) => mix(c, '#000000', t);
const disc = (c: C2D, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fill(); };
const poly = (c: C2D, pts: number[][]) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
function vgrad(c: C2D, y0: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}
function glowDisc(c: C2D, x: number, y: number, r: number, color: string, alpha = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.globalAlpha = alpha; c.fillStyle = g; disc(c, x, y, r); c.globalAlpha = 1;
}

function burst(v: View, x: number, y: number, n: number, color: string, sp: number, life = 26, r = 2.6, g = 0.08, glow = true) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = sp * (0.3 + Math.random() * 0.7);
    v.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life, max: life, c: color, r: r * (0.6 + Math.random() * 0.7), g, glow });
  }
}

export function onEvents(v: View, evs: Ev[], carY: number) {
  for (const e of evs) {
    if (e.t === 'coin') burst(v, CAR_X + 30, carY - 10, 7, '#ffd84a', 2.6, 22, 2.4);
    else if (e.t === 'bump') { burst(v, CAR_X, carY + 8, 14, '#b08968', 3, 28, 3.2, 0.1, false); v.shake = 8; }
    else if (e.t === 'right') { burst(v, CAR_X - 20, carY, 10, '#8dff9e', 3, 26, 2.6); v.flash = Math.max(v.flash, 4); }
    else if (e.t === 'wrong') burst(v, CAR_X, carY - 10, 9, '#ff8a8a', 2.4, 24, 2.6, 0.08, false);
    else if (e.t === 'power' && e.power) {
      burst(v, CAR_X, carY - 10, 34, e.power.color, 5, 46, 3.6, 0.03);
      burst(v, CAR_X, carY - 10, 14, '#ffffff', 3.4, 30, 2.2, 0.02);
      v.banner = { text: `${e.power.emoji} ${e.power.name.toUpperCase()}!`, sub: e.power.blurb, color: e.power.color, ttl: 120 };
      v.shake = 6; v.flash = 12;
    }
  }
}

// ── scenery ────────────────────────────────────────────────────────────────
function sky(ctx: C2D, t: Theme, v: View, off: number) {
  ctx.fillStyle = vgrad(ctx, 0, ROAD_Y, [[0, darken(t.sky[0], 0.12)], [0.55, t.sky[0]], [1, t.sky[1]]]);
  ctx.fillRect(0, 0, VW, ROAD_Y + 2);

  // sun with a soft halo and slow rays
  const sx = VW - 120, sy = 74;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(v.tick * 0.002);
  ctx.fillStyle = 'rgba(255,255,255,.07)';
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); poly(ctx, [[0, 0], [170, -13], [170, 13]]); }
  ctx.restore();
  glowDisc(ctx, sx, sy, 110, 'rgba(255,244,200,.55)');
  glowDisc(ctx, sx, sy, 46, 'rgba(255,255,240,1)');
  ctx.fillStyle = '#fffbe6'; disc(ctx, sx, sy, 22);

  // two cloud decks
  for (const [k, n, yb, sc, al] of [[0.06, 5, 44, 1.15, 0.75], [0.14, 6, 96, 0.8, 0.9]] as const) {
    for (let i = 0; i < n; i++) {
      const span = VW + 360, cx = wrap(i * (span / n) + hash(i + k * 100) * 120 - off * k, span) - 180;
      const cy = yb + hash(i * 3 + 7) * 40, s = sc * (0.75 + hash(i * 5 + 1) * 0.6);
      ctx.globalAlpha = al;
      for (const [dx, dy, r] of [[-34, 8, 20], [-12, -4, 27], [16, -1, 24], [40, 9, 17], [2, 12, 26]]) {
        const g = ctx.createRadialGradient(cx + dx * s, cy + dy * s - r * s * 0.35, r * s * 0.1, cx + dx * s, cy + dy * s, r * s);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.75, lighten(t.sky[1], 0.75)); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; disc(ctx, cx + dx * s, cy + dy * s, r * s);
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** One mountain range: a ridge line built from a few sines, filled with a top-lit gradient. */
function ridge(ctx: C2D, off: number, k: number, base: number, amp: number, col: string, seed: number, jag: number, snow: boolean) {
  const yAt = (w: number) => {
    const tri = Math.abs(wrap(w / 120 + seed, 2) - 1);
    return base - amp * (0.5 + 0.3 * Math.sin(w / 230 + seed) + 0.15 * Math.sin(w / 91 + seed * 2.3) + jag * (tri - 0.5) * 0.5);
  };
  ctx.fillStyle = vgrad(ctx, base - amp * 1.1, ROAD_Y, [[0, lighten(col, 0.16)], [0.6, col], [1, darken(col, 0.14)]]);
  ctx.beginPath(); ctx.moveTo(0, ROAD_Y + 2);
  for (let px = 0; px <= VW; px += 8) ctx.lineTo(px, yAt(px + off * k));
  ctx.lineTo(VW, ROAD_Y + 2); ctx.closePath(); ctx.fill();
  if (snow) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    for (let px = 0; px <= VW; px += 8) { const y = yAt(px + off * k); if (y < base - amp * 0.78) { ctx.moveTo(px - 9, y + 12); ctx.lineTo(px, y); ctx.lineTo(px + 9, y + 12); ctx.lineTo(px + 3, y + 9); ctx.lineTo(px - 3, y + 13); } }
    ctx.fill();
  }
}

function mountains(ctx: C2D, t: Theme, off: number) {
  const jag = t.deco === 'rock' || t.deco === 'volcano' ? 1 : t.deco === 'cactus' ? 0.5 : 0.15;
  ridge(ctx, off, 0.12, ROAD_Y - 40, 120, mix(t.far, t.sky[1], 0.6), 1.7, jag, t.deco === 'rock');
  ridge(ctx, off, 0.26, ROAD_Y - 22, 92, mix(t.far, t.sky[1], 0.25), 4.1, jag * 0.8, false);
  ridge(ctx, off, 0.48, ROAD_Y - 6, 62, t.near, 8.3, jag * 0.5, false);
  // ground haze where the hills meet the road
  ctx.fillStyle = vgrad(ctx, ROAD_Y - 46, ROAD_Y, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.28)']]);
  ctx.fillRect(0, ROAD_Y - 46, VW, 46);
}

function decoItem(ctx: C2D, t: Theme, i: number, tick: number) {
  const sway = Math.sin(tick * 0.03 + i) * 0.04;
  switch (t.deco) {
    case 'tree': case 'pine': {
      ctx.fillStyle = vgrad(ctx, -30, 0, [[0, '#7a5230'], [1, '#4f3320']]); ctx.fillRect(-4, -24, 8, 24);
      ctx.save(); ctx.rotate(sway);
      if (t.deco === 'pine') {
        for (let l = 0; l < 4; l++) {
          const w = 30 - l * 5.5, y = -22 - l * 16;
          ctx.fillStyle = l % 2 ? '#1f7a4a' : '#23864f'; poly(ctx, [[0, y - 26], [-w, y], [w, y]]);
          ctx.fillStyle = 'rgba(0,0,0,.18)'; poly(ctx, [[0, y - 26], [w, y], [w * 0.2, y]]);
        }
      } else {
        for (const [dx, dy, r, c] of [[-13, -40, 17, '#2f9442'], [13, -42, 18, '#339c47'], [0, -56, 20, '#41b356'], [-3, -36, 17, '#38a54c']] as const) { ctx.fillStyle = c; disc(ctx, dx, dy, r); }
        ctx.fillStyle = 'rgba(255,255,255,.2)'; disc(ctx, -6, -62, 9);
        ctx.fillStyle = 'rgba(0,0,0,.14)'; disc(ctx, 8, -32, 12);
      }
      ctx.restore(); break;
    }
    case 'palm': {
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -34, 16, -62); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.5;
      for (let s = 1; s < 7; s++) { ctx.beginPath(); ctx.moveTo(-3 + s * 2.4, -s * 9); ctx.lineTo(4 + s * 2.4, -s * 9 - 2); ctx.stroke(); }
      ctx.save(); ctx.translate(16, -62); ctx.rotate(sway * 2);
      for (const [a, len, c] of [[-2.7, 34, '#2f9d55'], [-2.1, 40, '#3bb265'], [-1.4, 36, '#2f9d55'], [-0.6, 40, '#3bb265'], [0, 34, '#2f9d55'], [0.5, 28, '#27894a']] as const) {
        ctx.save(); ctx.rotate(a); ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -11, len, 4); ctx.quadraticCurveTo(len * 0.5, 0, 0, 0); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#6b4423'; disc(ctx, 2, 3, 3.4); disc(ctx, -3, 2, 3);
      ctx.restore(); break;
    }
    case 'cactus': {
      const body = (x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = vgrad(ctx, y, y + h, [[0, '#4db35f'], [1, '#2f8443']]);
        ctx.beginPath(); ctx.roundRect(x, y, w, h, w / 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.roundRect(x + w * 0.2, y + 4, w * 0.18, h - 8, 2); ctx.fill();
      };
      body(-8, -58, 16, 58); body(-25, -44, 10, 24); ctx.fillStyle = '#3b9a50'; ctx.fillRect(-20, -27, 14, 8);
      body(15, -38, 10, 20); ctx.fillStyle = '#3b9a50'; ctx.fillRect(6, -25, 14, 8);
      ctx.fillStyle = '#ff7aa8'; disc(ctx, 0, -59, 4); ctx.fillStyle = '#ffd84a'; disc(ctx, 0, -59, 1.6);
      break;
    }
    case 'rock': {
      if (i % 2) {
        for (let l = 0; l < 3; l++) { const w = 22 - l * 5, y = -14 - l * 15; ctx.fillStyle = '#2c6e5a'; poly(ctx, [[0, y - 24], [-w, y], [w, y]]); ctx.fillStyle = '#f4faff'; poly(ctx, [[0, y - 24], [-w * 0.45, y - 12], [0, y - 15], [w * 0.45, y - 12]]); }
        ctx.fillStyle = '#5a4030'; ctx.fillRect(-3, -14, 6, 14);
      } else {
        ctx.fillStyle = '#8a93a3'; poly(ctx, [[-24, 0], [-14, -24], [4, -32], [22, -14], [26, 0]]);
        ctx.fillStyle = '#aab3c2'; poly(ctx, [[-14, -24], [4, -32], [-2, -12]]);
        ctx.fillStyle = '#6b7484'; poly(ctx, [[4, -32], [22, -14], [26, 0], [8, 0], [-2, -12]]);
        ctx.fillStyle = '#ffffff'; poly(ctx, [[-10, -25], [4, -32], [12, -24], [2, -24], [-3, -20]]);
      }
      break;
    }
    case 'city': {
      const h = 70 + hash(i * 7) * 70, w = 40 + hash(i * 3) * 22;
      ctx.fillStyle = vgrad(ctx, -h, 0, [[0, '#4a5478'], [1, '#2b3150']]); ctx.fillRect(-w / 2, -h, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(-w / 2, -h, 5, h);
      for (let wy = 0; wy < Math.floor(h / 13) - 1; wy++) for (let wx = 0; wx < Math.floor(w / 10) - 1; wx++) {
        ctx.fillStyle = hash(i * 31 + wy * 7 + wx) > 0.35 ? '#ffe9a0' : '#3a4366';
        ctx.fillRect(-w / 2 + 7 + wx * 10, -h + 8 + wy * 13, 5.5, 7.5);
      }
      if (i % 2) { ctx.fillStyle = '#2b3150'; ctx.fillRect(-1.5, -h - 20, 3, 20); ctx.fillStyle = '#ff5c5c'; disc(ctx, 0, -h - 21, 2.6); }
      break;
    }
    default: {                                       // volcano: scorched rock with glowing seams
      ctx.fillStyle = '#3b2536'; poly(ctx, [[-30, 0], [-16, -30], [-2, -22], [10, -42], [28, 0]]);
      ctx.fillStyle = '#54364c'; poly(ctx, [[-16, -30], [-2, -22], [-10, -8]]);
      ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 2; ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(10, -42); ctx.lineTo(7, -26); ctx.lineTo(13, -14); ctx.lineTo(9, 0); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

function deco(ctx: C2D, t: Theme, off: number, tick: number) {
  const gap = t.deco === 'city' ? 78 : 150, span = Math.ceil((VW + 300) / gap) * gap;
  const first = Math.floor((off * 0.8 - 150) / gap);
  for (let n = first; n < first + span / gap + 1; n++) {
    const px = n * gap + hash(n) * gap * 0.5 - off * 0.8;
    if (px < -90 || px > VW + 90) continue;
    const s = t.deco === 'city' ? 1 : 0.8 + hash(n * 9) * 0.55;
    ctx.save(); ctx.translate(px, ROAD_Y - 4); ctx.scale(s, s);
    decoItem(ctx, t, n, tick);
    ctx.restore();
  }
}

function road(ctx: C2D, t: Theme, off: number) {
  // verge behind the road
  ctx.fillStyle = vgrad(ctx, ROAD_Y - 10, ROAD_Y + 4, [[0, lighten(t.ground, 0.12)], [1, t.ground]]);
  ctx.fillRect(0, ROAD_Y - 10, VW, 14);
  // asphalt, lit along the middle
  ctx.fillStyle = vgrad(ctx, ROAD_Y, ROAD_Y + ROAD_H, [[0, darken(t.road, 0.3)], [0.18, t.road], [0.6, lighten(t.road, 0.08)], [1, darken(t.road, 0.22)]]);
  ctx.fillRect(0, ROAD_Y, VW, ROAD_H);
  // grit so the surface reads as moving
  for (let n = Math.floor(off / 26) - 1; n < Math.floor((off + VW) / 26) + 1; n++) {
    ctx.fillStyle = hash(n) > 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.12)';
    ctx.fillRect(n * 26 + hash(n * 3) * 20 - off, ROAD_Y + 8 + hash(n * 7) * (ROAD_H - 18), 3 + hash(n * 11) * 5, 1.6);
  }
  // red-and-white kerbs on both edges
  const k = wrap(off, 44);
  for (let x = -k - 44; x < VW + 44; x += 44) {
    for (const [y, h] of [[ROAD_Y - 1, 6], [ROAD_Y + ROAD_H - 5, 7]]) {
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x, y, 22, h);
      ctx.fillStyle = '#e23b3b'; ctx.fillRect(x + 22, y, 22, h);
    }
  }
  // centre line
  const d = wrap(off, 80);
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  for (let x = -d - 80; x < VW + 80; x += 80) { ctx.beginPath(); ctx.roundRect(x, ROAD_Y + 35, 42, 5, 2.5); ctx.fill(); }
  // near verge
  ctx.fillStyle = vgrad(ctx, ROAD_Y + ROAD_H, VH, [[0, darken(t.ground, 0.1)], [1, darken(t.ground, 0.34)]]);
  ctx.fillRect(0, ROAD_Y + ROAD_H + 2, VW, VH - ROAD_Y - ROAD_H);
}

/** Out-of-focus grass and posts racing past right in front of the camera. */
function foreground(ctx: C2D, t: Theme, off: number) {
  const gap = 120, first = Math.floor((off * 1.6 - 100) / gap);
  for (let n = first; n < first + VW / gap + 3; n++) {
    const px = n * gap + hash(n * 13) * 70 - off * 1.6;
    ctx.fillStyle = darken(t.ground, 0.45);
    for (let b = 0; b < 7; b++) {
      const bx = px + b * 7 - 20, h = 16 + hash(n * 5 + b) * 20;
      ctx.beginPath(); ctx.moveTo(bx - 4, VH + 2); ctx.quadraticCurveTo(bx - 2, VH - h * 0.6, bx + (b - 3) * 2.5, VH - h); ctx.quadraticCurveTo(bx + 2, VH - h * 0.5, bx + 5, VH + 2); ctx.fill();
    }
  }
}

function ambient(ctx: C2D, t: Theme, v: View) {
  if (t.deco !== 'volcano' && t.deco !== 'rock') return;
  const ember = t.deco === 'volcano';
  for (let i = 0; i < 26; i++) {
    const sp = 0.5 + hash(i) * 1.2;
    const x = wrap(hash(i * 3) * VW - v.tick * sp * (ember ? 0.6 : 1.6), VW);
    const y = ember ? ROAD_Y - wrap(v.tick * sp * 0.8 + hash(i * 7) * ROAD_Y, ROAD_Y) : wrap(v.tick * sp + hash(i * 7) * ROAD_Y, ROAD_Y + 60);
    if (ember) glowDisc(ctx, x, y, 5, 'rgba(255,150,60,.9)', 0.8);
    else { ctx.fillStyle = 'rgba(255,255,255,.85)'; disc(ctx, x, y, 1.2 + hash(i * 11) * 1.4); }
  }
}

// ── things on the road ──────────────────────────────────────────────────────
function coin(ctx: C2D, x: number, y: number, tick: number, seed: number) {
  const spin = Math.cos(tick * 0.09 + seed), w = Math.max(0.16, Math.abs(spin));
  glowDisc(ctx, x, y, 22, 'rgba(255,216,74,.5)');
  ctx.save(); ctx.translate(x, y); ctx.scale(w, 1);
  ctx.fillStyle = '#a56b00'; disc(ctx, 0, 1.5, 11);
  const g = ctx.createLinearGradient(-10, -10, 10, 10);
  g.addColorStop(0, '#fff3a6'); g.addColorStop(0.45, '#ffcf33'); g.addColorStop(1, '#e09600');
  ctx.fillStyle = g; disc(ctx, 0, 0, 11);
  ctx.strokeStyle = '#fff6c9'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#b97800'; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 2.4 : 5.6; if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  if (spin > 0.92) { ctx.fillStyle = '#ffffff'; poly(ctx, [[x - 5, y - 6], [x - 3.6, y - 9.5], [x - 2.2, y - 6], [x + 1, y - 4.6], [x - 2.2, y - 3.2], [x - 3.6, y + 0.3], [x - 5, y - 3.2], [x - 8.2, y - 4.6]]); }
}

function items(ctx: C2D, r: Race, v: View, off: number) {
  for (const it of r.items) {
    const px = it.x - off;
    if (it.gone || px < -50 || px > VW + 50) continue;
    const y = ROAD_Y + 30 - (it.y > 0 ? 70 : 0);
    if (it.kind === 'coin') coin(ctx, px, y + Math.sin(v.tick * 0.1 + it.x) * 3, v.tick, it.x);
    else if (it.kind === 'rock') {
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px + 2, y + 13, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6f7888'; poly(ctx, [[px - 19, y + 12], [px - 13, y - 6], [px - 2, y - 13], [px + 12, y - 7], [px + 19, y + 12]]);
      ctx.fillStyle = '#a3acbb'; poly(ctx, [[px - 13, y - 6], [px - 2, y - 13], [px - 4, y + 1]]);
      ctx.fillStyle = '#8b94a4'; poly(ctx, [[px - 2, y - 13], [px + 12, y - 7], [px + 4, y + 3], [px - 4, y + 1]]);
      ctx.fillStyle = '#565e6c'; poly(ctx, [[px + 12, y - 7], [px + 19, y + 12], [px + 6, y + 12], [px + 4, y + 3]]);
    } else {
      const g = ctx.createRadialGradient(px - 6, y + 8, 2, px, y + 9, 26);
      g.addColorStop(0, '#7b5cd6'); g.addColorStop(0.35, '#2a6f8f'); g.addColorStop(0.7, '#1b1b2b'); g.addColorStop(1, 'rgba(20,20,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, y + 9, 27, 7.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(px - 8, y + 7, 7, 1.6, -0.2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function wheel(ctx: C2D, x: number, y: number, rot: number, R = 10.5) {
  const k = R / 10.5;
  ctx.fillStyle = '#15171c'; disc(ctx, x, y, R);
  if (R > 12) {                                     // chunky off-road tread
    ctx.strokeStyle = '#0b0c0f'; ctx.lineWidth = 2.4 * k;
    for (let i = 0; i < 14; i++) { const a = rot + (i * Math.PI) / 7; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R * 0.86, y + Math.sin(a) * R * 0.86); ctx.lineTo(x + Math.cos(a) * (R + 1.2), y + Math.sin(a) * (R + 1.2)); ctx.stroke(); }
  }
  ctx.fillStyle = '#2a2d35'; disc(ctx, x, y, R * 0.8);
  const g = ctx.createRadialGradient(x - 2 * k, y - 2 * k, 1, x, y, R * 0.66);
  g.addColorStop(0, '#f2f4f8'); g.addColorStop(1, '#8b93a1');
  ctx.fillStyle = g; disc(ctx, x, y, R * 0.63);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.fillStyle = '#3a3e48';
  for (let i = 0; i < 5; i++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.moveTo(1.6, -1.6); ctx.lineTo(6, -1); ctx.lineTo(6, 1); ctx.lineTo(1.6, 1.6); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = '#d7dbe3'; disc(ctx, x, y, 2 * k);
}

/** Where each kind of vehicle keeps its wheels, how high it rides, and where its tail and nose are. */
interface Spec { wr: number; rear: number; front: number; lift: number; half: number; tail: number; nose: number }
const SPEC: Record<CarKind, Spec> = {
  sport: { wr: 10.5, rear: -25, front: 26, lift: 0, half: 44, tail: -42, nose: 42 },
  super: { wr: 10.5, rear: -27, front: 28, lift: 0, half: 48, tail: -45, nose: 46 },
  f1: { wr: 10.5, rear: -28, front: 31, lift: 0, half: 52, tail: -42, nose: 50 },
  rally: { wr: 11, rear: -24, front: 25, lift: 1, half: 43, tail: -40, nose: 41 },
  jeep: { wr: 13.5, rear: -24, front: 25, lift: 5, half: 46, tail: -40, nose: 42 },
  pickup: { wr: 12.5, rear: -27, front: 27, lift: 4, half: 49, tail: -46, nose: 45 },
  monster: { wr: 19, rear: -29, front: 29, lift: 17, half: 54, tail: -40, nose: 42 },
  buggy: { wr: 12, rear: -25, front: 27, lift: 2, half: 45, tail: -38, nose: 40 },
  kart: { wr: 7, rear: -17, front: 19, lift: -6, half: 32, tail: -26, nose: 30 },
  van: { wr: 10, rear: -25, front: 26, lift: 0, half: 47, tail: -44, nose: 44 },
};

function helmet(ctx: C2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color; disc(ctx, x, y, r);
  ctx.fillStyle = '#10131a'; ctx.beginPath(); ctx.arc(x, y, r * 0.86, -0.75, 0.55); ctx.lineTo(x, y); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; disc(ctx, x - r * 0.35, y - r * 0.4, r * 0.22);
}

/** The bodywork of one vehicle kind, drawn with its sills at y = 10. */
function bodywork(ctx: C2D, m: CarModel, s: Spec, rot: number) {
  const c = m.color, a = m.accent;
  const paint = (y0: number, y1: number, col = c) => {
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, lighten(col, 0.45)], [0.35, col], [1, darken(col, 0.4)]]);
    ctx.strokeStyle = darken(col, 0.6); ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  };
  const glassFill = (y0: number, y1: number) => { ctx.fillStyle = vgrad(ctx, y0, y1, [[0, '#dff4ff'], [1, '#6fb6e6']]); };
  const done = () => { ctx.closePath(); ctx.fill(); ctx.stroke(); };
  const lamp = (x: number, y: number) => { ctx.fillStyle = '#fff6b8'; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 2.6, 0, 0, Math.PI * 2); ctx.fill(); };
  const tail = (x: number, y: number) => { ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x, y, 2.6, 5); };

  switch (m.kind) {
    case 'sport': {
      paint(-22, 14); ctx.beginPath();
      ctx.moveTo(-42, 10); ctx.lineTo(-43, -2); ctx.quadraticCurveTo(-42, -8, -34, -9); ctx.lineTo(-25, -10);
      ctx.quadraticCurveTo(-16, -23, -2, -23); ctx.lineTo(8, -23); ctx.quadraticCurveTo(20, -22, 27, -11);
      ctx.quadraticCurveTo(40, -9, 43, -2); ctx.quadraticCurveTo(46, 4, 44, 10); done();
      ctx.fillStyle = darken(c, 0.25); ctx.beginPath(); ctx.roundRect(-46, -17, 15, 3.6, 1.6); ctx.fill(); ctx.fillRect(-40, -14, 2.6, 6);
      glassFill(-22, -9); ctx.beginPath(); ctx.moveTo(-22, -10.5); ctx.quadraticCurveTo(-14, -20.5, -3, -20.5); ctx.lineTo(7, -20.5); ctx.quadraticCurveTo(17, -20, 23, -10.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = darken(c, 0.2); ctx.fillRect(-0.8, -20.5, 2.6, 10);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; poly(ctx, [[-14, -18.5], [-9, -19.5], [-15, -11.5], [-19, -11.5]]);
      ctx.fillStyle = a; ctx.globalAlpha = 0.9; ctx.fillRect(-42, -1.5, 86, 2.4); ctx.globalAlpha = 1;
      lamp(42, -2.5); tail(-43.6, -5); break;
    }
    case 'super': {
      paint(-20, 14); ctx.beginPath();
      ctx.moveTo(-45, 10); ctx.lineTo(-46, -1); ctx.quadraticCurveTo(-45, -9, -35, -10); ctx.lineTo(-17, -12);
      ctx.quadraticCurveTo(-5, -21, 9, -19); ctx.quadraticCurveTo(24, -14, 34, -6); ctx.lineTo(46, 0); ctx.quadraticCurveTo(50, 5, 47, 10); done();
      glassFill(-19, -8); ctx.beginPath(); ctx.moveTo(-13, -11.5); ctx.quadraticCurveTo(-4, -18.5, 8, -17); ctx.quadraticCurveTo(18, -13.5, 25, -8); ctx.lineTo(-13, -8.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; poly(ctx, [[-8, -15.5], [-3, -17], [-9, -9.5], [-12, -9.5]]);
      ctx.fillStyle = a; poly(ctx, [[-22, -4], [-8, -2], [-10, 5], [-26, 5]]);                 // side intake
      ctx.fillStyle = darken(c, 0.3); ctx.beginPath(); ctx.roundRect(-49, -16, 14, 3, 1.5); ctx.fill(); ctx.fillRect(-43, -13.5, 2.4, 4.5);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(12, -17); ctx.quadraticCurveTo(26, -11, 44, -1); ctx.stroke();
      lamp(44, 0.5); tail(-46.6, -5); break;
    }
    case 'f1': {
      ctx.fillStyle = darken(c, 0.35); ctx.fillRect(-45, -19, 3, 16); ctx.fillRect(42, 6.5, 14, 3.4);         // wing strut, front wing
      paint(-24, -18, a); ctx.beginPath(); ctx.roundRect(-53, -24, 17, 4.6, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = a; ctx.fillRect(-54, -25, 3, 13);
      paint(-12, 12); ctx.beginPath();
      ctx.moveTo(-40, 8); ctx.lineTo(-40, -3); ctx.lineTo(-22, -9); ctx.lineTo(-6, -10.5); ctx.quadraticCurveTo(3, -10, 9, -6); ctx.lineTo(51, 3.5); ctx.lineTo(51, 8); done();
      paint(-20, -8, a); ctx.beginPath(); ctx.moveTo(-23, -8.5); ctx.lineTo(-19, -19); ctx.lineTo(-9, -19); ctx.lineTo(-5, -10.5); done();   // airbox
      helmet(ctx, 1.5, -12, 5.4, '#ffffff');
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.85; poly(ctx, [[-36, -1], [30, 1.5], [30, 3.6], [-36, 2]]); ctx.globalAlpha = 1;
      break;
    }
    case 'rally': {
      paint(-25, 14); ctx.beginPath();
      ctx.moveTo(-40, 10); ctx.lineTo(-41, -4); ctx.quadraticCurveTo(-40, -10, -35, -12); ctx.lineTo(-29, -22); ctx.quadraticCurveTo(-27, -24.5, -21, -24.5);
      ctx.lineTo(8, -24.5); ctx.quadraticCurveTo(18, -23.5, 25, -11.5); ctx.quadraticCurveTo(37, -9.5, 40, -3); ctx.quadraticCurveTo(43, 4, 41, 10); done();
      ctx.fillStyle = a; ctx.beginPath(); ctx.roundRect(-38, -28, 12, 3.2, 1.5); ctx.fill();
      glassFill(-23, -11); ctx.beginPath(); ctx.moveTo(-26, -21.5); ctx.lineTo(7, -21.5); ctx.quadraticCurveTo(15, -20.5, 21, -12); ctx.lineTo(-31, -12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = darken(c, 0.25); ctx.fillRect(-6, -21.5, 2.6, 9.6);
      ctx.fillStyle = a; poly(ctx, [[-40, 1], [41, -2], [41, 2], [-40, 5]]); poly(ctx, [[14, -10], [22, -10], [16, 9], [8, 9]]);
      ctx.fillStyle = '#ffffff'; disc(ctx, -15, -1, 6.4); ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#111'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('5', -15, -0.5);
      ctx.fillStyle = '#ffe14d'; disc(ctx, 30, -13, 2.8); disc(ctx, 35.5, -11.5, 2.8);
      ctx.fillStyle = '#1b1e24'; ctx.fillRect(-37.5, 9, 3, 8);
      lamp(40, -3.5); tail(-41.5, -7); break;
    }
    case 'jeep': {
      ctx.strokeStyle = a; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(-28, -26); ctx.lineTo(3, -26); ctx.moveTo(-12, -26); ctx.lineTo(-12, -8); ctx.stroke();
      glassFill(-26, -8); poly(ctx, [[3, -26], [6, -26], [13, -8], [9, -8]]);
      ctx.fillStyle = '#2b2f38'; ctx.beginPath(); ctx.roundRect(-9, -18, 9, 11, 2); ctx.fill();          // seat
      paint(-9, 12); ctx.beginPath(); ctx.moveTo(-40, 10); ctx.lineTo(-40, -8); ctx.lineTo(14, -8); ctx.lineTo(38, -6); ctx.quadraticCurveTo(42, -5, 42, 0); ctx.lineTo(42, 10); done();
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.strokeRect(-10, -5, 17, 13);
      ctx.fillStyle = a; for (const wx of [s.rear, s.front]) { ctx.beginPath(); ctx.arc(wx, 10, s.wr + 3.5, Math.PI, 0); ctx.arc(wx, 10, s.wr + 0.5, 0, Math.PI, true); ctx.fill(); }
      ctx.fillStyle = '#9aa3b1'; ctx.beginPath(); ctx.roundRect(40, 3, 6, 6, 1.5); ctx.fill();
      wheel(ctx, -45, -2, 0.6, 9);                                                                    // spare
      lamp(41, -2.5); break;
    }
    case 'pickup': {
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-40, -13, 16, 8); ctx.strokeStyle = '#5c3a17'; ctx.lineWidth = 1; ctx.strokeRect(-40, -13, 16, 8);   // crate in the bed
      paint(-8, 12); ctx.beginPath(); ctx.moveTo(-46, 10); ctx.lineTo(-46, -7); ctx.lineTo(-12, -7); ctx.lineTo(-12, 10); done();
      paint(-25, 12); ctx.beginPath(); ctx.moveTo(-13, 10); ctx.lineTo(-13, -22); ctx.quadraticCurveTo(-12, -24.5, -7, -24.5); ctx.lineTo(9, -24.5);
      ctx.quadraticCurveTo(18, -23.5, 24, -10.5); ctx.lineTo(40, -8.5); ctx.quadraticCurveTo(45, -7, 45, 0); ctx.lineTo(45, 10); done();
      glassFill(-23, -10); ctx.beginPath(); ctx.moveTo(-9, -21.5); ctx.lineTo(8, -21.5); ctx.quadraticCurveTo(15, -20.5, 20, -11); ctx.lineTo(-9, -11); ctx.closePath(); ctx.fill();
      ctx.fillStyle = a; ctx.fillRect(-46, -1, 91, 2.6);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-45, -6.4, 32, 1.4);
      ctx.fillStyle = '#9aa3b1'; ctx.beginPath(); ctx.roundRect(43, 3, 5, 6, 1.5); ctx.fill();
      lamp(44, -3); tail(-47, -5); break;
    }
    case 'monster': {
      const ay = 21 - s.wr + s.lift;                                                                  // axle height in body space
      ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3.2;
      for (const wx of [s.rear, s.front]) { ctx.beginPath(); ctx.moveTo(wx - 9, 8); ctx.lineTo(wx, ay); ctx.lineTo(wx + 9, 8); ctx.stroke(); }
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.4;
      for (const wx of [s.rear, s.front]) { ctx.beginPath(); for (let k = 0; k < 5; k++) ctx.lineTo(wx + (k % 2 ? 3 : -3), 8 + (k * (ay - 8)) / 4); ctx.stroke(); }
      paint(-24, 10); ctx.beginPath(); ctx.moveTo(-40, 8); ctx.lineTo(-40, -6); ctx.lineTo(-15, -8); ctx.lineTo(-9, -23); ctx.lineTo(13, -23); ctx.lineTo(22, -8); ctx.lineTo(40, -5.5); ctx.quadraticCurveTo(43, -4, 43, 2); ctx.lineTo(42, 8); done();
      glassFill(-21, -8); poly(ctx, [[-7, -20.5], [11.5, -20.5], [18, -9], [-11.5, -9]]);
      ctx.fillStyle = a; poly(ctx, [[-40, 3], [-22, -3], [-28, 1], [-8, -2], [-16, 3], [4, 1], [-6, 6], [-40, 7]]);       // flame decal
      ctx.fillStyle = '#ffe14d'; for (const lx of [-4, 2, 8]) disc(ctx, lx, -25.5, 2.2);
      lamp(42, -1); tail(-41.5, -4); break;
    }
    case 'buggy': {
      ctx.fillStyle = '#9aa3b1'; ctx.beginPath(); ctx.roundRect(-40, -9, 13, 14, 2); ctx.fill(); ctx.fillStyle = '#6b7280'; for (let i = 0; i < 3; i++) ctx.fillRect(-38.5, -7 + i * 4, 10, 1.6);   // engine
      ctx.fillStyle = '#2b2f38'; ctx.beginPath(); ctx.roundRect(-12, -12, 9, 16, 2); ctx.fill();
      helmet(ctx, -2, -15, 5.6, '#ffffff');
      paint(-6, 12); ctx.beginPath(); ctx.moveTo(-36, 10); ctx.lineTo(-36, 4); ctx.lineTo(12, 4); ctx.lineTo(16, -6); ctx.lineTo(38, 0); ctx.quadraticCurveTo(41, 2, 40, 10); done();
      ctx.strokeStyle = a; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-34, 5); ctx.lineTo(-30, -15); ctx.lineTo(-7, -26); ctx.lineTo(14, -21); ctx.lineTo(35, -1); ctx.moveTo(-7, -26); ctx.lineTo(-13, 5); ctx.moveTo(14, -21); ctx.lineTo(12, 5); ctx.stroke();
      ctx.fillStyle = '#ffe14d'; disc(ctx, 22, -15, 2.6); disc(ctx, 27, -10.5, 2.6);
      break;
    }
    case 'kart': {
      ctx.fillStyle = '#9aa3b1'; ctx.beginPath(); ctx.roundRect(-27, 1, 10, 9, 2); ctx.fill();
      ctx.fillStyle = '#2b2f38'; poly(ctx, [[-14, 10], [-18, -4], [-11, -4], [-8, 10]]);
      ctx.fillStyle = a; ctx.beginPath(); ctx.roundRect(-10, -6, 10, 15, 3); ctx.fill();                 // driver
      ctx.strokeStyle = a; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(8, 0); ctx.stroke();
      helmet(ctx, -4, -12, 6.6, c);
      ctx.strokeStyle = '#1b1e24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(13, 9); ctx.stroke(); disc(ctx, 9, -3, 2.2);
      paint(8, 17); ctx.beginPath(); ctx.roundRect(-26, 9, 46, 6, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, 9); ctx.lineTo(31, 6.5); ctx.quadraticCurveTo(33, 10, 31, 15); ctx.lineTo(16, 15); done();
      ctx.fillStyle = '#ffffff'; disc(ctx, 24, 10.6, 3); ctx.fillStyle = '#111'; ctx.font = '900 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('7', 24, 10.9);
      break;
    }
    case 'van': {
      paint(-28, 14); ctx.beginPath(); ctx.roundRect(-44, -27, 88, 37, [9, 15, 4, 4]); ctx.fill(); ctx.stroke();
      glassFill(-23, -8);
      for (const wx of [-37, -18, 1]) { ctx.beginPath(); ctx.roundRect(wx, -22, 16, 12, 2.5); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(22, -22); ctx.lineTo(34, -22); ctx.quadraticCurveTo(40, -19, 41.5, -10); ctx.lineTo(22, -10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; poly(ctx, [[-33, -21], [-29, -21], [-34, -11], [-36, -11]]); poly(ctx, [[26, -21], [30, -21], [26, -11], [23.5, -11]]);
      ctx.fillStyle = a; ctx.fillRect(-44, -5, 88, 5);
      ctx.fillStyle = darken(c, 0.3); ctx.beginPath(); ctx.roundRect(-30, -31, 44, 4, 2); ctx.fill();
      ctx.fillStyle = '#9aa3b1'; ctx.beginPath(); ctx.roundRect(42, 3, 5, 6, 1.5); ctx.fill();
      lamp(43, -1.5); tail(-45, -3); break;
    }
  }
  ctx.textBaseline = 'alphabetic';
  void rot;
}

/** Any vehicle from the garage, side on, nose to the right. */
function car(ctx: C2D, x: number, y: number, m: CarModel, rot: number, o: { tilt?: number; flame?: number; lights?: boolean; scale?: number; bounce?: number } = {}) {
  const s = SPEC[m.kind];
  ctx.save(); ctx.translate(x, y); ctx.scale(o.scale ?? 1, o.scale ?? 1);
  ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(0, 19, s.half + 2, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(o.tilt ?? 0);
  const axle = 21 - s.wr;

  ctx.save(); ctx.translate(0, -s.lift + (o.bounce ?? 0));
  if (o.flame) {                                    // exhaust flame
    const f = o.flame, tx = s.tail + 2;
    for (const [len, w, col] of [[30 * f, 7, 'rgba(255,120,30,.85)'], [20 * f, 4.5, '#ffd84a'], [10 * f, 2.6, '#ffffff']] as const) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(tx, 5 - w); ctx.quadraticCurveTo(tx - 6 - len * 0.6, 5, tx - 4 - len - Math.random() * 6, 6); ctx.quadraticCurveTo(tx - 6 - len * 0.6, 7, tx, 5 + w); ctx.fill();
    }
  }
  if (o.lights) {                                   // headlight beam
    const g = ctx.createLinearGradient(s.nose, 0, s.nose + 110, 0);
    g.addColorStop(0, 'rgba(255,246,190,.5)'); g.addColorStop(1, 'rgba(255,246,190,0)');
    ctx.fillStyle = g; poly(ctx, [[s.nose - 2, -3], [s.nose + 108, -18], [s.nose + 108, 20], [s.nose - 2, 3]]);
  }
  bodywork(ctx, m, s, rot);
  ctx.restore();

  if (m.kind !== 'f1' && m.kind !== 'kart' && m.kind !== 'buggy' && m.kind !== 'monster' && m.kind !== 'jeep') {
    ctx.fillStyle = '#0f1115';                      // arches cut into the bodywork
    for (const wx of [s.rear, s.front]) { ctx.beginPath(); ctx.arc(wx, axle - s.lift * 0.5, s.wr + 2, Math.PI, 0); ctx.fill(); }
  }
  wheel(ctx, s.rear, axle, rot, m.kind === 'buggy' ? s.wr + 1.5 : s.wr);
  wheel(ctx, s.front, m.kind === 'buggy' ? axle + 2 : axle, rot, m.kind === 'buggy' ? s.wr - 2 : s.wr);
  ctx.restore();
}

/** A still of one vehicle for the garage screen. */
export function drawCarThumb(ctx: C2D, m: CarModel, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const s = m.kind === 'monster' ? 0.95 : m.kind === 'kart' ? 1.5 : 1.15;
  car(ctx, w / 2, h * 0.58, m, 0.4, { scale: s });
}

// ── power-ups ───────────────────────────────────────────────────────────────
function powerFx(ctx: C2D, p: Power, x: number, y: number, v: View) {
  const t = v.tick;
  ctx.save();
  ctx.shadowColor = p.color; ctx.shadowBlur = 16;
  switch (p.id) {
    case 'nimbus': {
      const bob = Math.sin(t * 0.18) * 3;
      for (let i = 1; i <= 4; i++) { ctx.fillStyle = `rgba(255,233,168,${0.8 - i * 0.16})`; disc(ctx, x - 50 - i * 26, y + 26 + bob + Math.sin(t * 0.2 + i) * 4, 15 - i * 2.4); }
      ctx.fillStyle = '#ffc94a';
      for (const [dx, dy, r] of [[-40, 24, 24], [-8, 30, 30], [30, 24, 24], [-24, 15, 20], [16, 16, 21]]) disc(ctx, x + dx, y + dy + bob, r);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff1bf';
      for (const [dx, dy, r] of [[-28, 14, 13], [8, 15, 14], [32, 19, 9], [-46, 20, 8]]) disc(ctx, x + dx, y + dy + bob, r);
      break;
    }
    case 'dragon': {
      ctx.strokeStyle = '#c9b6ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + 42, y - 2); ctx.quadraticCurveTo(x + 70, y + 6, x + 96, y - 16); ctx.stroke();
      const hx = x + 132, hy = y - 22 + Math.sin(t * 0.2) * 6;
      for (let i = 6; i >= 1; i--) {                 // body segments trail back past the car
        const sx = hx - 22 - i * 20, sy = hy + Math.sin(t * 0.2 - i * 0.7) * 10;
        ctx.fillStyle = i % 2 ? '#4fc16a' : '#66d67f'; disc(ctx, sx, sy, 13 - i * 1.3);
        ctx.fillStyle = '#ffd84a'; poly(ctx, [[sx - 5, sy - 11 + i], [sx, sy - 19 + i], [sx + 5, sy - 11 + i]]);
      }
      ctx.fillStyle = '#5fd07a'; ctx.beginPath(); ctx.ellipse(hx, hy, 24, 14, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#66d67f'; ctx.beginPath(); ctx.ellipse(hx + 18, hy + 3, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffd84a'; poly(ctx, [[hx - 12, hy - 11], [hx - 18, hy - 26], [hx - 4, hy - 13]]); poly(ctx, [[hx, hy - 13], [hx - 2, hy - 28], [hx + 8, hy - 12]]);
      ctx.fillStyle = '#fff'; disc(ctx, hx + 7, hy - 4, 4.6); ctx.fillStyle = '#111'; disc(ctx, hx + 8.4, hy - 4, 2.3);
      ctx.fillStyle = '#ff7a1a'; poly(ctx, [[hx + 30, hy + 2], [hx + 52 + Math.random() * 6, hy + 4], [hx + 30, hy + 8]]);
      break;
    }
    case 'rocket':
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
      for (let i = 0; i < 7; i++) { const sy = y - 26 + i * 8, sx = x - 70 - wrap(t * 12 + i * 37, 150); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 44, sy); ctx.stroke(); }
      break;                                         // the flame itself is drawn by car()
    case 'rainbow': {
      ctx.shadowBlur = 10;
      ['#ff5d5d', '#ff9f2e', '#ffe14d', '#62d86e', '#4cc9ff', '#a678ff'].forEach((c, i) => {
        ctx.strokeStyle = c; ctx.lineWidth = 6.5; ctx.shadowColor = c;
        ctx.beginPath(); ctx.moveTo(x - 38, y + 20 + i * 6); ctx.bezierCurveTo(x - 130, y + 14 + i * 6, x - 230, y + 30 + i * 6, x - 340, y + 96 + i * 6); ctx.stroke();
      });
      break;
    }
    case 'lightning':
      glowDisc(ctx, x, y, 70, 'rgba(255,225,77,.35)');
      for (const [w, col] of [[6, '#ffe14d'], [2.2, '#ffffff']] as const) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round';
        for (let i = 0; i < 6; i++) {
          const a = t * 0.3 + i * 1.05, r1 = 44, r2 = 74 + Math.sin(t * 0.4 + i) * 8, rm = (r1 + r2) / 2;
          ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.55);
          ctx.lineTo(x + Math.cos(a) * rm + Math.sin(a) * 10, y + Math.sin(a) * rm * 0.55);
          ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2 * 0.55); ctx.stroke();
        }
      }
      break;
    case 'wings': {
      const flap = Math.sin(t * 0.35) * 0.4;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(x - 6, y - 14); ctx.rotate(s * (0.55 + flap));
        ctx.fillStyle = vgrad(ctx, -30, 10, [[0, '#ffffff'], [1, '#bfe9ff']]); ctx.strokeStyle = '#6fc9ef'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-40, -34, -84, -10); ctx.quadraticCurveTo(-66, -4, -62, 4); ctx.quadraticCurveTo(-46, 0, -42, 8); ctx.quadraticCurveTo(-26, 2, -20, 8); ctx.quadraticCurveTo(-10, 4, 0, 0); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'shield': {
      const g = ctx.createRadialGradient(x - 14, y - 16, 6, x, y - 2, 60);
      g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(0.6, 'rgba(123,224,123,.14)'); g.addColorStop(1, 'rgba(123,224,123,.45)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 2, 62 + Math.sin(t * 0.2) * 3, 40 + Math.sin(t * 0.2) * 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b9ffc0'; ctx.lineWidth = 2.5; ctx.stroke();
      break;
    }
    case 'magnet':
      ctx.strokeStyle = '#ff8fab'; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { ctx.globalAlpha = 1 - i * 0.22; ctx.beginPath(); ctx.arc(x + 46, y - 4, 16 + i * 20 + wrap(t * 2, 20), -0.95, 0.95); ctx.stroke(); }
      ctx.globalAlpha = 1;
      break;
    case 'freeze':
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(160,220,255,.16)'; ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#e8f8ff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      for (let i = 0; i < 12; i++) ctx.fillText('❄', wrap(hash(i) * VW - t * 0.8, VW), wrap(t * (1.2 + hash(i * 5)) + hash(i * 9) * ROAD_Y, ROAD_Y + 20));
      break;
    case 'coinrain':
      ctx.shadowBlur = 0;
      for (let i = 0; i < 12; i++) coin(ctx, wrap(hash(i * 3) * VW - t * 2.2, VW), wrap(t * (3 + hash(i) * 2) + hash(i * 7) * ROAD_Y, ROAD_Y + 20), t, i * 9);
      break;
  }
  ctx.restore();
}

// ── HUD ─────────────────────────────────────────────────────────────────────
function glass(ctx: C2D, x: number, y: number, w: number, h: number, r = 12) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, 'rgba(30,41,66,.86)'], [1, 'rgba(10,15,30,.86)']]);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, w - 4, h / 2 - 2, [r - 2, r - 2, 4, 4]); ctx.fill();
}

function hud(ctx: C2D, r: Race, v: View) {
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';

  // progress rail
  const x0 = 26, w = VW - 232, py = 26;
  glass(ctx, 12, 12, w + 52, 28, 14);
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.roundRect(x0, py - 3, w, 6, 3); ctx.fill();
  const me = x0 + w * Math.min(1, r.x / TRACK), him = x0 + w * Math.min(1, r.rx / TRACK);
  const g = ctx.createLinearGradient(x0, 0, me, 0); g.addColorStop(0, '#2f6bff'); g.addColorStop(1, '#6fe3ff');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x0, py - 3, Math.max(4, me - x0), 6, 3); ctx.fill();
  ctx.fillStyle = '#ff5d5d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(him, py, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  glowDisc(ctx, me, py, 14, 'rgba(111,227,255,.8)');
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(me, py, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(x0 + w + 8 + (i % 3) * 5, py - 5 + Math.floor(i / 3) * 5, 5, 5); }

  // streak orbs
  glass(ctx, VW - 158, 12, 146, 28, 14);
  ctx.font = '800 11px sans-serif'; ctx.fillStyle = '#cbd5e1'; ctx.fillText('CHUỖI', VW - 148, 26.5);
  const lit = r.streak > 0 && r.streak % 5 === 0 ? 5 : r.streak % 5;
  for (let i = 0; i < 5; i++) {
    const ox = VW - 96 + i * 17;
    if (i < lit) { glowDisc(ctx, ox, 26, 13, 'rgba(255,216,74,.9)'); ctx.fillStyle = '#ffd84a'; }
    else ctx.fillStyle = 'rgba(255,255,255,.18)';
    disc(ctx, ox, 26, 5.6);
    if (i < lit) { ctx.fillStyle = 'rgba(255,255,255,.8)'; disc(ctx, ox - 1.6, 24.2, 1.8); }
  }

  // coins + score
  glass(ctx, 12, VH - 40, 178, 28, 14);
  coin(ctx, 30, VH - 26, 0, 0);
  ctx.font = '800 14px sans-serif'; ctx.fillStyle = '#ffd84a'; ctx.fillText(String(r.coins), 46, VH - 25.5);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(82, VH - 34, 1, 16);
  ctx.fillStyle = '#fff'; ctx.fillText(`${r.score}`, 92, VH - 25.5);
  ctx.font = '700 10px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('ĐIỂM', 92 + ctx.measureText(`${r.score}`).width * 1.45 + 6, VH - 25);

  // speedometer
  glass(ctx, VW / 2 - 52, VH - 40, 104, 28, 14);
  const kmh = Math.round(r.v * 42);
  ctx.textAlign = 'right'; ctx.font = '900 16px sans-serif'; ctx.fillStyle = kmh > 180 ? '#ffd84a' : '#fff'; ctx.fillText(String(kmh), VW / 2 + 8, VH - 25.5);
  ctx.textAlign = 'left'; ctx.font = '700 10px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('km/h', VW / 2 + 13, VH - 24.5);

  if (r.power) {                                    // power-up timer
    const p = r.power, f = r.powerT / p.dur;
    glass(ctx, VW - 190, VH - 46, 178, 34, 14);
    ctx.font = '800 12px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`${p.emoji} ${p.name}`, VW - 178, VH - 33);
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.roundRect(VW - 178, VH - 22, 154, 5, 2.5); ctx.fill();
    ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.roundRect(VW - 178, VH - 22, Math.max(3, 154 * f), 5, 2.5); ctx.fill(); ctx.shadowBlur = 0;
  }

  if (v.banner) {                                   // power-up announcement
    const b = v.banner, age = 120 - b.ttl, s = 1 + Math.max(0, 1 - age / 9) * 0.6;
    ctx.save(); ctx.translate(VW / 2, 112); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, b.ttl / 20); ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10,15,30,.55)'; ctx.beginPath(); ctx.roundRect(-230, -30, 460, 74, 20); ctx.fill();
    ctx.shadowColor = b.color; ctx.shadowBlur = 22;
    ctx.font = '900 32px sans-serif'; ctx.lineWidth = 6; ctx.strokeStyle = '#0f172a'; ctx.lineJoin = 'round';
    ctx.strokeText(b.text, 0, -2); ctx.fillStyle = b.color; ctx.fillText(b.text, 0, -2);
    ctx.shadowBlur = 0; ctx.font = '700 14px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(b.sub, 0, 26);
    ctx.restore();
    if (--b.ttl <= 0) v.banner = null;
  }
  ctx.textBaseline = 'alphabetic';
}

function finishGate(ctx: C2D, fx: number) {
  for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#15171c'; ctx.fillRect(fx + j * 9, ROAD_Y + i * 8.3, 9, 8.3); }
  for (const px of [fx - 8, fx + 132]) {
    ctx.fillStyle = vgrad(ctx, ROAD_Y - 120, ROAD_Y, [[0, '#f5f5f5'], [1, '#aeb6c2']]); ctx.fillRect(px, ROAD_Y - 120, 9, 124);
    ctx.fillStyle = '#e23b3b'; for (let s = 0; s < 5; s++) ctx.fillRect(px, ROAD_Y - 112 + s * 24, 9, 10);
  }
  ctx.fillStyle = '#15171c'; ctx.fillRect(fx - 8, ROAD_Y - 132, 149, 30);
  for (let i = 0; i < 15; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) { ctx.fillStyle = '#fff'; ctx.fillRect(fx - 8 + i * 10, ROAD_Y - 132 + j * 10, 10, 10); }
  ctx.fillStyle = '#e23b3b'; ctx.beginPath(); ctx.roundRect(fx + 26, ROAD_Y - 127, 80, 20, 5); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '900 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VỀ ĐÍCH', fx + 66, ROAD_Y - 116.5);
  ctx.textBaseline = 'alphabetic';
}

export function draw(ctx: C2D, r: Race, v: View, scale: number) {
  v.tick++;
  const off = r.x - CAR_X, fast = Math.max(0, Math.min(1, (r.v - 3.2) / 3));
  const carY = ROAD_Y + 26 - r.fly * 118 + (r.fly < 0.1 ? Math.sin(v.tick * 0.5) * 0.6 : Math.sin(v.tick * 0.12) * 3 * r.fly);
  const sx = v.shake > 0.3 ? (Math.random() - 0.5) * v.shake : 0, sy = v.shake > 0.3 ? (Math.random() - 0.5) * v.shake * 0.6 : 0;
  v.shake *= 0.86;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.save(); ctx.translate(sx, sy);
  sky(ctx, r.theme, v, off);
  mountains(ctx, r.theme, off);
  ambient(ctx, r.theme, v);
  deco(ctx, r.theme, off, v.tick);
  road(ctx, r.theme, off);
  items(ctx, r, v, off);
  const fx = TRACK - off;
  if (fx < VW + 80) finishGate(ctx, fx);

  // the rival, drawn relative to you but never allowed off screen
  const gap = (r.rx - r.x) * 0.9, rivalX = CAR_X + Math.max(-175, Math.min(gap, VW - CAR_X - 70));
  car(ctx, rivalX, ROAD_Y + 9, v.rival, v.tick * 0.45, { scale: 0.84 });   // the far lane, so the two never overlap
  if (r.power?.id === 'freeze') {
    ctx.fillStyle = vgrad(ctx, ROAD_Y - 14, ROAD_Y + 46, [[0, 'rgba(220,245,255,.75)'], [1, 'rgba(120,200,255,.5)']]);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(rivalX - 50, ROAD_Y - 30, 100, 62, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; poly(ctx, [[rivalX - 40, ROAD_Y - 24], [rivalX - 26, ROAD_Y - 24], [rivalX - 44, ROAD_Y + 6]]);
  }
  if (gap > VW - CAR_X - 70) { ctx.fillStyle = '#ff5d5d'; poly(ctx, [[VW - 20, ROAD_Y - 2], [VW - 5, ROAD_Y + 7], [VW - 20, ROAD_Y + 16]]); }

  // you
  if (r.fly > 0.05) { ctx.fillStyle = `rgba(0,0,0,${0.28 - r.fly * 0.14})`; ctx.beginPath(); ctx.ellipse(CAR_X, ROAD_Y + 44, 40 * (1 - r.fly * 0.4), 6, 0, 0, Math.PI * 2); ctx.fill(); }
  if (r.power) powerFx(ctx, r.power, CAR_X, carY, v);
  const flame = r.power?.id === 'rocket' ? 2.2 : r.boost > 0 ? 1 : 0;
  const bounce = v.car.kind === 'monster' || v.car.kind === 'jeep' ? Math.sin(v.tick * 0.3) * 1.6 : 0;
  car(ctx, CAR_X, carY, v.car, v.tick * (r.v / 2.2) * 0.4, { tilt: -fast * 0.05 - r.fly * 0.06, flame, lights: true, bounce });
  if (r.slow > 0) for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(150,130,110,${0.5 - i * 0.1})`; disc(ctx, CAR_X - 44 - i * 13 - wrap(v.tick * 2, 13), carY + 12 - i * 2, 7 + i * 2); }

  // sparks and dust
  v.parts = v.parts.filter((p) => --p.life > 0);
  for (const p of v.parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g;
    const a = Math.min(1, p.life / p.max);
    if (p.glow) glowDisc(ctx, p.x, p.y, p.r * 3.2, p.c, a * 0.5);
    ctx.globalAlpha = a; ctx.fillStyle = p.c; disc(ctx, p.x, p.y, p.r);
  }
  ctx.globalAlpha = 1;

  foreground(ctx, r.theme, off);
  if (fast > 0.05) {                                // streaks across the frame at speed
    ctx.strokeStyle = `rgba(255,255,255,${0.32 * fast})`; ctx.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) { const ly = 40 + hash(i) * (VH - 80), lx = VW - wrap(v.tick * (16 + hash(i * 3) * 12) + hash(i * 7) * VW, VW + 200); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 60 + fast * 90, ly); ctx.stroke(); }
  }
  ctx.restore();

  // lens: darker corners, and a flash when something good happens
  const vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, VW * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,20,.42)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  if (v.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${v.flash / 40})`; ctx.fillRect(0, 0, VW, VH); v.flash--; }

  hud(ctx, r, v);
}
