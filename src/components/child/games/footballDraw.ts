// Canvas renderer for the football reward game: scrolling camera, cartoon sprites, particles, HUD.
import { CHARS, CHARGE_FULL, GY1, GY2, H, SUPERS, VH, VW, W, type Char, type Ev, type Game, type P } from '@/lib/football/sim';

export const MY_SHIRT = '#2563eb';
const GK_SHIRT = ['#f59e0b', '#f472b6'];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; grav: number }
export interface View {
  cx: number; cy: number; shake: number; cheer: number; flash: number; tick: number;
  parts: Particle[]; trail: { x: number; y: number }[];
}
export const newView = (): View => ({ cx: W / 2 - VW / 2, cy: H / 2 - VH / 2, shake: 0, cheer: 0, flash: 0, tick: 0, parts: [], trail: [] });

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const CONFETTI = ['#ffe14d', '#ff6b6b', '#4cc9ff', '#7be07b', '#ffffff', '#ff9ff3'];

function burst(v: View, x: number, y: number, n: number, color: string | string[], speed: number, life = 26, size = 2.5, grav = 0) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
    v.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, size: size * (0.6 + Math.random() * 0.8), grav, color: Array.isArray(color) ? color[i % color.length] : color });
  }
}

/** Turn this frame's sim events into particles / shake / crowd reactions. */
export function onEvents(v: View, evs: Ev[]) {
  for (const e of evs) {
    if (e.t === 'kick' || e.t === 'bounce' || e.t === 'slide') burst(v, e.x, e.y + 6, e.t === 'slide' ? 7 : 3, '#e7f7d4', 1.4, 16, 2);
    else if (e.t === 'bigkick') { burst(v, e.x, e.y, 9, '#ffffff', 2.6, 18); v.shake = Math.max(v.shake, 3); }
    else if (e.t === 'tackle') { burst(v, e.x, e.y - 8, 9, '#ffe14d', 2.6, 24, 3); v.shake = Math.max(v.shake, 4); }
    else if (e.t === 'steal' || e.t === 'recv') burst(v, e.x, e.y - 4, 5, '#bfe6ff', 1.6, 14, 2);
    else if (e.t === 'save') { burst(v, e.x, e.y - 6, 10, '#9fe8ff', 2.8, 22); v.shake = Math.max(v.shake, 3); }
    else if (e.t === 'post') { burst(v, e.x, e.y, 12, '#ffffff', 3.2, 20); v.shake = Math.max(v.shake, 6); }
    else if (e.t === 'super') { burst(v, e.x, e.y - 6, 26, e.color ?? '#fff', 4, 34, 3.5); v.shake = Math.max(v.shake, 7); }
    else if (e.t === 'awake') { burst(v, e.x, e.y - 10, 30, e.side === 0 ? '#ffe14d' : '#ff8a8a', 4.4, 40, 3.2); burst(v, e.x, e.y - 10, 12, '#ffffff', 3, 26, 2); v.shake = Math.max(v.shake, 6); v.flash = Math.max(v.flash, 8); }
    else if (e.t === 'goal') {
      for (let i = 0; i < 4; i++) burst(v, clamp(e.x, 20, W - 20) + (Math.random() - 0.5) * 120, e.y + (Math.random() - 0.5) * 120, 18, CONFETTI, 4.5, 80, 3.2, 0.06);
      v.shake = 11; v.cheer = 170; v.flash = 14;
    }
  }
}

const poly = (ctx: CanvasRenderingContext2D, pts: number[][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); };
const disc = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
const cap = (ctx: CanvasRenderingContext2D) => { ctx.beginPath(); ctx.arc(0, -16, 7.9, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); };

const hexMix = (c: string, to: string, t: number) => {
  const n = parseInt(c.slice(1, 7), 16), m = parseInt(to.slice(1, 7), 16);
  const ch = (sh: number) => Math.round(((n >> sh) & 255) + (((m >> sh) & 255) - ((n >> sh) & 255)) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

function drawHair(ctx: CanvasRenderingContext2D, c: Char, fx: number, color: string, shine: string) {
  ctx.fillStyle = color;
  switch (c.style) {
    case 'spiky': cap(ctx); poly(ctx, [[-8, -17], [-12.5, -26], [-6, -22.5], [-4.5, -32.5], [0, -24], [4.5, -32.5], [6, -22.5], [12.5, -26], [8, -17]]); break;
    case 'mohawk': cap(ctx); poly(ctx, [[-3.2, -19], [-5, -28], [-2, -27], [-1, -35], [1.6, -28], [4.4, -31], [3.2, -19]]); break;
    case 'long': cap(ctx); poly(ctx, [[-9.4, -18], [-10.4, -3], [-7.4, -6], [-6, -16]]); poly(ctx, [[9.4, -18], [10.4, -3], [7.4, -6], [6, -16]]); poly(ctx, [[-7, -20], [-2, -17], [3, -21], [7, -18], [7.5, -23], [-7.5, -23]]); break;
    case 'band': cap(ctx); poly(ctx, [[-7, -21], [-3, -25.5], [0, -22], [3, -26], [7, -21]]); ctx.fillStyle = c.aura; ctx.fillRect(-7.9, -19.6, 15.8, 2.6); poly(ctx, fx >= 0 ? [[-7.5, -19.5], [-13, -22], [-12, -17], [-7.5, -17]] : [[7.5, -19.5], [13, -22], [12, -17], [7.5, -17]]); break;
    case 'cap': cap(ctx); ctx.beginPath(); ctx.roundRect(fx >= 0 ? 0 : -12, -18, 12, 3, 1.5); ctx.fill(); ctx.fillStyle = c.aura; disc(ctx, 0, -23.6, 1.6); break;
    case 'bun': cap(ctx); disc(ctx, 0, -26, 4.2); poly(ctx, [[-7, -19], [-2, -17.5], [2, -19.5], [7, -17.5], [7, -22], [-7, -22]]); break;
    case 'curly': [[-6.4, -19, 4], [-2.2, -23, 4.4], [3, -23, 4.4], [7, -19, 4], [-8.4, -14.8, 2.9], [8.4, -14.8, 2.9]].forEach(([x, y, r]) => disc(ctx, x, y, r)); break;
    case 'hood': return; // drawn behind the head
  }
  ctx.fillStyle = shine; ctx.beginPath(); ctx.ellipse(-3, -21, 3.4, 1.5, -0.5, 0, Math.PI * 2); ctx.fill();
}

/** Rising flame aura: a ring of flickering tongues, drawn behind the player. */
function flameAura(ctx: CanvasRenderingContext2D, color: string, tick: number, size: number, alpha: number) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-13 * size, 9);
  for (let i = 0; i <= 8; i++) {
    const x = (-13 + i * 3.25) * size, edge = 1 - Math.abs(i - 4) / 5;
    const h = (22 + edge * 24 + Math.sin(tick * 0.45 + i * 1.9) * 6) * size;
    ctx.quadraticCurveTo(x - 1.6 * size, 9 - h * 0.55, x + Math.sin(tick * 0.3 + i) * 1.5, 9 - h);
    ctx.quadraticCurveTo(x + 1.6 * size, 9 - h * 0.5, x + 1.6 * size, 9 - h * 0.25);
  }
  ctx.lineTo(13 * size, 9); ctx.quadraticCurveTo(0, 15, -13 * size, 9); ctx.fill();
  ctx.globalAlpha = 1;
}

export interface Pose { fx: number; fy: number; shirt: string; gk?: boolean; side?: 0 | 1; tick: number; moving?: boolean; down?: boolean; slide?: boolean; kick?: boolean; cheer?: boolean; dive?: number; aura?: boolean; sprint?: boolean; /** awakening stage 0…3 */ lv?: number }

export function drawChar(ctx: CanvasRenderingContext2D, c: Char, x: number, y: number, o: Pose, scale = 1.45) {
  const lv = o.lv ?? 0, t = o.tick;
  const OUT = '#1b1f2a';
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 10.5, 9, 3.4, 0, 0, Math.PI * 2); ctx.fill();

  // awakening: a glowing ring on the grass, then flames in the warrior's own colour
  if (lv >= 3 && !o.down) { ctx.strokeStyle = c.aura; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.5 + Math.sin(t * 0.3) * 0.3; ctx.beginPath(); ctx.ellipse(0, 10.5, 15 + Math.sin(t * 0.2) * 2, 5.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  if ((lv >= 1 || o.aura) && !o.down) {
    const size = 0.8 + Math.max(lv, o.aura ? 1 : 0) * 0.13;
    flameAura(ctx, c.aura, t, size, 0.38);
    flameAura(ctx, hexMix(c.aura, '#ffffff', 0.55), t + 9, size * 0.68, lv >= 2 ? 0.5 : 0.3);
    if (lv >= 3) flameAura(ctx, '#ffffff', t + 17, size * 0.42, 0.55);
  }

  const ph = t * (o.sprint ? 0.55 : 0.4), sw = o.moving ? Math.sin(ph) : 0;
  if (o.down) { ctx.translate(0, 6); ctx.rotate(o.fx >= 0 ? -Math.PI / 2 : Math.PI / 2); ctx.translate(0, 6); }
  else if (o.slide) { ctx.translate(0, 4); ctx.rotate(o.fx >= 0 ? -1.15 : 1.15); }
  else if (o.dive) { ctx.translate(0, 2); ctx.rotate(o.dive * 1.05); }
  else if (o.cheer) ctx.translate(0, -Math.abs(Math.sin(t * 0.28)) * 6);
  else if (o.moving) ctx.translate(0, Math.abs(sw) * -1.2);

  ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.9;
  // legs: skin, sock, boot
  const leg = (lx: number, len: number) => {
    ctx.fillStyle = c.skin; ctx.fillRect(lx, 4, 3.4, len);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(lx, 4 + len - 4.2, 3.4, 2.8);
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.roundRect(lx - 0.6, 4 + len - 1.8, 5.2, 2.6, 1.2); ctx.fill();
  };
  if (o.kick && !o.down) {
    leg(-4.4, 6);
    ctx.save(); ctx.translate(1.6, 5); ctx.rotate(o.fx >= 0 ? -1.1 : 1.1); ctx.translate(-1.7, -4); leg(0, 7.4); ctx.restore();
  } else { leg(-4.4, 6 + sw * 2.4); leg(1, 6 - sw * 2.4); }
  // shorts
  ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.roundRect(-5.8, 0.6, 11.6, 5.2, 1.4); ctx.fill(); ctx.stroke();
  // shirt, shaded
  const sg = ctx.createLinearGradient(-6, 0, 6.5, 0);
  sg.addColorStop(0, hexMix(o.shirt, '#ffffff', 0.28)); sg.addColorStop(0.55, o.shirt); sg.addColorStop(1, hexMix(o.shirt, '#000000', 0.3));
  ctx.fillStyle = sg; ctx.beginPath(); ctx.roundRect(-6.6, -9.8, 13.2, 12, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; poly(ctx, [[-2.4, -9.8], [2.4, -9.8], [0, -6.6]]);   // collar
  ctx.fillStyle = c.aura; ctx.fillRect(-6.4, -1.4, 12.8, 1.5);                               // waistband in the warrior's colour
  const armUp = o.cheer || !!o.dive;
  for (const s of [-1, 1]) {
    const ax = s * 7.9 - 1.6, ay = armUp ? -17 : -8.6 + (s > 0 ? sw : -sw) * 1.6;
    ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.roundRect(ax, armUp ? -13.4 : -8.8, 3.3, armUp ? 5.4 : 5.8, 1.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.gk ? '#ffffff' : c.skin;
    if (o.gk) { disc(ctx, ax + 1.6, ay + (armUp ? 2 : 8), 2.9); ctx.stroke(); } else ctx.fillRect(ax + 0.2, ay + (armUp ? 0 : 5.6), 2.9, 3.3);
  }

  // head
  const hairCol = lv >= 2 ? hexMix(c.aura, '#ffffff', lv >= 3 ? 0.55 : 0.25) : c.hair;
  const shine = lv >= 2 ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.3)';
  const hairUp = lv >= 2 && c.style !== 'hood' && c.style !== 'cap';
  const hair = () => {
    ctx.save();
    if (hairUp) { ctx.translate(0, -15); ctx.scale(1.1, 1.24 + Math.sin(t * 0.5) * 0.04); ctx.translate(0, 15); }   // hair stands on end
    drawHair(ctx, c, o.fx, hairCol, shine);
    ctx.restore();
  };
  if (c.style === 'hood') { ctx.fillStyle = hairCol; disc(ctx, 0, -15, 9.6); poly(ctx, [[-4.4, -23], [0, -30], [4.4, -23]]); ctx.fillStyle = shine; ctx.beginPath(); ctx.ellipse(-4, -21, 3, 1.3, -0.6, 0, Math.PI * 2); ctx.fill(); }
  const hr = c.style === 'hood' ? 6.7 : 7.7;
  ctx.fillStyle = c.skin; disc(ctx, 0, -15, hr); ctx.strokeStyle = OUT; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.beginPath(); ctx.arc(0, -15, hr - 0.5, 0.15, Math.PI - 0.15); ctx.fill();      // shade under the chin
  if (o.fy < -0.55 && !o.down) { ctx.fillStyle = hairCol; disc(ctx, 0, -15.4, 7.9); hair(); }
  else {
    hair();
    const ex = o.fx * 2.3, ey = Math.max(0, o.fy) * 1.6;
    if (o.down) { ctx.strokeStyle = '#111'; ctx.lineWidth = 1; for (const s of [-3, 2.4]) { ctx.beginPath(); ctx.moveTo(s - 1.3 + ex, -16.3); ctx.lineTo(s + 1.3 + ex, -13.7); ctx.moveTo(s + 1.3 + ex, -16.3); ctx.lineTo(s - 1.3 + ex, -13.7); ctx.stroke(); } }
    else {
      for (const s of [-1, 1]) {
        const cx = s * 2.9 + ex, cy = -14.8 + ey;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, cy, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = lv >= 3 ? c.aura : '#1b1f2a'; ctx.beginPath(); ctx.ellipse(cx + o.fx * 0.6, cy + 0.3, 1.25, 1.9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; disc(ctx, cx + o.fx * 0.6 - 0.4, cy - 0.6, 0.55);
        ctx.strokeStyle = lv >= 2 ? hairCol : '#1b1f2a'; ctx.lineWidth = 1.1;                                       // brow, set low when powered up
        ctx.beginPath(); ctx.moveTo(cx - s * 2.3, cy - 3.6 - (lv >= 1 ? 0.7 : 0)); ctx.lineTo(cx + s * 1.6, cy - 3 + (lv >= 1 ? 0.7 : 0)); ctx.stroke();
      }
      ctx.strokeStyle = '#7a1f1f'; ctx.lineWidth = 0.9; ctx.fillStyle = '#7a1f1f';
      if (o.cheer) { ctx.beginPath(); ctx.arc(ex, -11.4 + ey, 2.2, 0, Math.PI); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(ex, -11.6 + ey, 1.5, 0.15, Math.PI - 0.15); ctx.stroke(); }
    }
  }

  // stage 2: sparks circling; stage 3: crackling arcs
  if (lv >= 2 && !o.down) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) { const a = t * 0.16 + i * 1.57; disc(ctx, Math.cos(a) * 13, -6 + Math.sin(a) * 15, 0.9 + (i % 2) * 0.5); }
  }
  if (lv >= 3 && !o.down) {
    for (const [w, col] of [[2.2, c.aura], [0.9, '#ffffff']] as const) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      for (let i = 0; i < 3; i++) {
        const k = Math.floor(t / 5) * 7 + i * 13, r = (n: number) => { const q = Math.sin(k * 12.9898 + n * 78.233) * 43758.5453; return q - Math.floor(q); };
        const x0 = -12 + r(1) * 24, y0 = -26 + r(2) * 30;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (r(3) - 0.5) * 9, y0 + 4); ctx.lineTo(x0 + (r(4) - 0.5) * 9, y0 + 8); ctx.lineTo(x0 + (r(5) - 0.5) * 9, y0 + 12); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawStadium(ctx: CanvasRenderingContext2D, v: View, awayColor: string) {
  ctx.fillStyle = '#1d5a2a'; ctx.fillRect(-80, -90, W + 160, H + 160);
  // stands along the top touchline
  ctx.fillStyle = '#273449'; ctx.fillRect(-80, -90, W + 160, 62);
  const x0 = Math.floor((v.cx - 20) / 14) * 14;
  for (let x = x0; x < v.cx + VW + 20; x += 14) for (let r = 0; r < 4; r++) {
    const k = Math.abs(((x / 14) | 0) * 7 + r * 13);
    const jump = v.cheer > 0 ? Math.abs(Math.sin(v.tick * 0.35 + k)) * 5 : Math.sin(v.tick * 0.05 + k) * 0.8;
    ctx.fillStyle = [MY_SHIRT, awayColor, '#f8fafc', '#fbbf24', '#f472b6'][k % 5];
    disc(ctx, x + (r % 2) * 7, -82 + r * 13 - jump, 4.2);
    ctx.fillStyle = '#f2c48d'; disc(ctx, x + (r % 2) * 7, -87 + r * 13 - jump, 2.6);
  }
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-80, -30, W + 160, 4);
  // advertising boards
  for (let i = 0; i < 8; i++) { ctx.fillStyle = ['#fde047', '#38bdf8', '#fb7185', '#a3e635'][i % 4]; ctx.fillRect(i * 120 + 4, -24, 112, 14); ctx.fillStyle = '#0f172a'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(['MATH FUN', 'HỌC GIỎI – ĐÁ HAY', '100 ĐIỂM!', 'CỐ LÊN!'][i % 4], i * 120 + 60, -13.5); }
  // grass
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#3f9d49' : '#48ab53'; ctx.fillRect((W / 12) * i, 0, W / 12, H); }
  ctx.strokeStyle = 'rgba(255,255,255,.88)'; ctx.lineWidth = 2.5;
  ctx.strokeRect(0, 0, W, H);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 62, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff'; disc(ctx, W / 2, H / 2, 3.5);
  for (const s of [0, 1]) {
    const bx = s ? W - 130 : 0, sx = s ? W - 48 : 0;
    ctx.strokeRect(bx, H / 2 - 145, 130, 290); ctx.strokeRect(sx, H / 2 - 85, 48, 170);
    disc(ctx, s ? W - 96 : 96, H / 2, 2.5);
    ctx.beginPath(); ctx.arc(s ? W - 96 : 96, H / 2, 58, s ? Math.PI * 0.7 : -Math.PI * 0.3, s ? Math.PI * 1.3 : Math.PI * 0.3); ctx.stroke();
    // goal + net
    const gx = s ? W : -24;
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(gx, GY1, 24, GY2 - GY1);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
    for (let y = GY1; y <= GY2 + 0.1; y += (GY2 - GY1) / 10) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + 24, y); ctx.stroke(); }
    for (let x = 0; x <= 24; x += 6) { ctx.beginPath(); ctx.moveTo(gx + x, GY1); ctx.lineTo(gx + x, GY2); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeRect(gx, GY1, 24, GY2 - GY1);
    ctx.fillStyle = '#fff'; disc(ctx, s ? W : 0, GY1, 4); disc(ctx, s ? W : 0, GY2, 4);
    ctx.strokeStyle = 'rgba(255,255,255,.88)'; ctx.lineWidth = 2.5;
  }
}

/** One distinct look per special move — the whole point of charging the ki bar. */
function drawSuper(ctx: CanvasRenderingContext2D, g: Game, v: View, by: number) {
  const b = g.ball, sup = b.sup!, col = SUPERS[sup.kind].color;
  const ang = Math.atan2(b.vy, b.vx) || 0, tick = v.tick;
  const tail = (n: number, step: number, fn: (x: number, y: number, k: number) => void) => {
    for (let k = 1; k <= n; k++) fn(b.x - Math.cos(ang) * k * step, by - Math.sin(ang) * k * step, k);
  };

  switch (sup.kind) {
    case 'blast': {                                   // Cầu lửa: a rolling ball of flame
      tail(7, 9, (x, y, k) => {
        const w = Math.sin(tick * 0.6 + k) * 3;
        ctx.fillStyle = k > 4 ? '#ff6b1a66' : k > 2 ? '#ff8c1aaa' : '#ffb020';
        disc(ctx, x + w * 0.3, y + w, 11 - k);
      });
      ctx.fillStyle = col + '44'; disc(ctx, b.x, by, 18 + Math.sin(tick * 0.8) * 2);
      ctx.fillStyle = '#ff7a1a'; disc(ctx, b.x, by, 12);
      ctx.fillStyle = '#ffc93c'; disc(ctx, b.x, by, 8);
      ctx.fillStyle = '#fff6cf'; disc(ctx, b.x - Math.cos(ang) * 1.5, by - Math.sin(ang) * 1.5, 4.5);
      break;
    }
    case 'zigzag': {                                  // Tia sét: a crackling bolt
      if (v.trail.length > 1) {
        for (const [w, color] of [[8, col + '55'], [3.5, col], [1.6, '#ffffff']] as const) {
          ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
          v.trail.forEach((t, i) => (i ? ctx.lineTo(t.x, t.y + (i % 2 ? 5 : -5)) : ctx.moveTo(t.x, t.y)));
          ctx.stroke();
        }
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = tick * 0.5 + i * 1.6;
        ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 9, by + Math.sin(a) * 9);
        ctx.lineTo(b.x + Math.cos(a) * 19, by + Math.sin(a) * 19); ctx.stroke();
      }
      ctx.fillStyle = col + '77'; disc(ctx, b.x, by, 13);
      ctx.fillStyle = '#ffffff'; disc(ctx, b.x, by, 6.5);
      break;
    }
    case 'arrow': {                                   // Mũi tên băng: a frozen dart
      tail(4, 13, (x, y, k) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.fillStyle = col + (k > 2 ? '44' : '88');
        poly(ctx, [[-6, -4 + k], [4, 0], [-6, 4 + k]]);
        ctx.restore();
      });
      ctx.save(); ctx.translate(b.x, by); ctx.rotate(ang);
      ctx.fillStyle = col + '55'; ctx.beginPath(); ctx.roundRect(-26, -7, 44, 14, 7); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(-18, -2.6, 28, 5.2);
      ctx.fillStyle = '#eafaff'; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(24, 0); ctx.lineTo(8, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; poly(ctx, [[-18, -3], [-26, -10], [-12, -3]]); poly(ctx, [[-18, 3], [-26, 10], [-12, 3]]);
      ctx.restore();
      break;
    }
    case 'boomerang': {                               // Chuối bay vòng: a spinning banana
      const spin = tick * 0.65;
      for (let k = 3; k >= 0; k--) {
        ctx.save();
        ctx.translate(b.x - Math.cos(ang) * k * 7, by - Math.sin(ang) * k * 7);
        ctx.rotate(spin - k * 0.5);
        ctx.globalAlpha = k === 0 ? 1 : 0.22;
        ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = '#a97c00'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-15, 7); ctx.quadraticCurveTo(0, -20, 15, 7);
        ctx.quadraticCurveTo(0, -5, -15, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6b4423'; disc(ctx, -15, 7, 2.4); disc(ctx, 15, 7, 2.4);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'sky': {                                     // Thiên thạch: a rock falling on the goal
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sup.x1, sup.y1, 10 + (tick % 20), 0, Math.PI * 2); ctx.stroke();
      for (let k = 7; k >= 1; k--) {                  // flame tail points back up the arc
        const x = b.x - Math.cos(ang) * k * 10, y = by - Math.sin(ang) * k * 10 - k * 3;
        ctx.fillStyle = k > 4 ? '#ff6b1a55' : '#ffa52aaa'; disc(ctx, x, y, 12 - k);
      }
      ctx.fillStyle = '#ffd36b88'; disc(ctx, b.x, by, 19);
      ctx.fillStyle = '#6b5a4b'; disc(ctx, b.x, by, 11);
      ctx.fillStyle = '#4a3d33'; disc(ctx, b.x - 3, by - 2, 3); disc(ctx, b.x + 4, by + 3, 2.2);
      break;
    }
    case 'leaf': {                                    // Bão lá: leaves whirling round the ball
      ctx.fillStyle = col + '44'; disc(ctx, b.x, by, 26);
      for (let i = 0; i < 9; i++) {
        const a = tick * 0.26 + (i * Math.PI * 2) / 9, r = 23 + Math.sin(tick * 0.2 + i) * 6;
        ctx.save(); ctx.translate(b.x + Math.cos(a) * r, by + Math.sin(a) * r); ctx.rotate(a + tick * 0.1);
        ctx.fillStyle = ['#3fae4c', '#7be07b', '#2d8f3a'][i % 3];
        ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1f6b2a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -9.5); ctx.lineTo(0, 9.5); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#eafde9'; disc(ctx, b.x, by, 9);
      break;
    }
    case 'kame': {                                    // Sóng ánh sao: a beam fired from the hands
      const dx = b.x - sup.x0, dy = by - sup.y0, len = Math.hypot(dx, dy);
      const w = 18 + Math.sin(tick * 0.7) * 4;
      ctx.save(); ctx.translate(sup.x0, sup.y0); ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = col + '44'; ctx.fillRect(0, -w / 2, len, w);
      ctx.fillStyle = col + 'bb'; ctx.fillRect(0, -w / 3.2, len, w / 1.6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -w / 7, len, w / 3.5);
      ctx.restore();
      ctx.fillStyle = col + '55'; disc(ctx, b.x, by, 24 + Math.sin(tick * 0.7) * 3);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, by, 17 + Math.sin(tick * 0.5) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = col; disc(ctx, b.x, by, 13);
      ctx.fillStyle = '#ffffff'; disc(ctx, b.x, by, 8);
      break;
    }
    case 'void': {                                    // Hố đen: everything spirals inward
      ctx.fillStyle = col + '33'; disc(ctx, b.x, by, 34);
      ctx.fillStyle = col + '22'; disc(ctx, b.x, by, 44 + Math.sin(tick * 0.3) * 3);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {                   // debris being sucked in
        const a = tick * 0.14 + (i * Math.PI) / 4, r1 = 46 - ((tick * 1.6 + i * 6) % 22);
        ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * r1, by + Math.sin(a) * r1);
        ctx.lineTo(b.x + Math.cos(a) * (r1 - 12), by + Math.sin(a) * (r1 - 12)); ctx.stroke();
      }
      ctx.strokeStyle = col; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.arc(b.x, by, 19 + Math.sin(tick * 0.4) * 2.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#140c22'; disc(ctx, b.x, by, 17);
      ctx.fillStyle = '#ffffff'; disc(ctx, b.x + Math.cos(tick * 0.3) * 3, by + Math.sin(tick * 0.3) * 3, 1.8);
      break;
    }
  }
}

function drawBall(ctx: CanvasRenderingContext2D, g: Game, v: View) {
  const b = g.ball, by = b.y - b.z * 0.85, speed = Math.hypot(b.vx, b.vy);
  const aura = b.sup ? SUPERS[b.sup.kind].color : '#ffffff';
  if (b.sup || speed > 7.5) { v.trail.push({ x: b.x, y: by }); if (v.trail.length > (b.sup ? 14 : 7)) v.trail.shift(); } else if (v.trail.length) v.trail.shift();

  // ground shadow, bigger the lower the ball flies
  ctx.fillStyle = `rgba(0,0,0,${0.3 - Math.min(0.18, b.z * 0.002)})`;
  ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, 5 - Math.min(2, b.z * 0.03), 2.4, 0, 0, Math.PI * 2); ctx.fill();

  if (b.sup) { drawSuper(ctx, g, v, by); return; }

  v.trail.forEach((t, i) => { ctx.fillStyle = aura + Math.round((i / v.trail.length) * 90 + 16).toString(16).padStart(2, '0'); disc(ctx, t.x, t.y, 2 + i * 0.4); });
  const r = 5 + Math.min(4, b.z * 0.035);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, by, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const rot = (b.x + b.y) * 0.12;
  ctx.fillStyle = '#111'; disc(ctx, b.x + Math.cos(rot) * r * 0.45, by + Math.sin(rot) * r * 0.45, r * 0.3); disc(ctx, b.x - Math.cos(rot) * r * 0.5, by - Math.sin(rot) * r * 0.5, r * 0.22);
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: Game, p: P, v: View, awayColor: string) {
  const c = CHARS[p.ch], isCtl = p === g.ctl, moving = Math.hypot(p.vx, p.vy) > 0.35;
  if (isCtl) { // ring under the player you control
    ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(p.x, p.y + 14, 15, 6, 0, 0, Math.PI * 2); ctx.stroke();
  }
  const cheer = g.phase === 'goal' && p.side === g.lastGoal && p.down === 0;
  drawChar(ctx, c, p.x, p.y, {
    fx: p.fx, fy: p.fy, shirt: p.gk ? GK_SHIRT[p.side] : p.side === 0 ? MY_SHIRT : awayColor, gk: p.gk, tick: v.tick + p.role * 5,
    moving, down: p.down > 0, slide: p.slide > 0, kick: p.kickT > 0, cheer, dive: p.gk && Math.abs(p.vy) > 1.6 ? p.dive : 0,
    aura: (g.ki[p.side] >= 100 && g.ball.owner === p) || (g.freeze > 0 && g.ball.noP === p), sprint: p.sprint, lv: g.awake[p.side],
  });
  if (p.down > 0) { ctx.fillStyle = '#ffe14d'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; for (let i = 0; i < 3; i++) ctx.fillText('★', p.x + Math.cos(v.tick * 0.2 + i * 2.1) * 10, p.y - 26 + Math.sin(v.tick * 0.2 + i * 2.1) * 4); }
  if (isCtl) {
    const bob = Math.sin(v.tick * 0.2) * 2;
    ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p.x - 7, p.y - 60 + bob); ctx.lineTo(p.x + 7, p.y - 60 + bob); ctx.lineTo(p.x, p.y - 50 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (p.charge > 0) {
      const f = Math.min(1, p.charge / CHARGE_FULL), full = f >= 1 && g.ki[0] >= 100;
      ctx.fillStyle = '#000a'; ctx.beginPath(); ctx.roundRect(p.x - 19, p.y + 22, 38, 7, 3); ctx.fill();
      ctx.fillStyle = full ? c.aura : f >= 1 ? '#ef4444' : f > 0.6 ? '#f59e0b' : '#facc15'; ctx.beginPath(); ctx.roundRect(p.x - 18, p.y + 23, 36 * f, 5, 2.5); ctx.fill();
    }
  }
}

function hud(ctx: CanvasRenderingContext2D, g: Game, v: View) {
  const lv = g.level;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // scoreboard
  ctx.fillStyle = 'rgba(15,23,42,.86)'; ctx.beginPath(); ctx.roundRect(VW / 2 - 150, 6, 300, 28, 10); ctx.fill();
  ctx.fillStyle = MY_SHIRT; ctx.beginPath(); ctx.roundRect(VW / 2 - 146, 10, 76, 20, 7); ctx.fill();
  ctx.fillStyle = lv.color; ctx.beginPath(); ctx.roundRect(VW / 2 + 54, 10, 92, 20, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('BẠN', VW / 2 - 108, 20.5); ctx.fillText(`${lv.emoji} ${lv.name.replace('Đội ', '')}`, VW / 2 + 100, 20.5);
  ctx.font = 'bold 18px sans-serif'; ctx.fillText(`${g.score[0]}`, VW / 2 - 52, 21); ctx.fillText(`${g.score[1]}`, VW / 2 + 38, 21);
  const sec = Math.max(0, Math.ceil(g.time / 60));
  ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = g.golden ? '#ffe14d' : sec <= 10 ? '#ff8a8a' : '#e2e8f0';
  ctx.fillText(g.golden ? 'VÀNG' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, VW / 2 - 7, 21);

  // difficulty badge
  ctx.fillStyle = 'rgba(15,23,42,.7)'; ctx.beginPath(); ctx.roundRect(8, 8, 74, 22, 8); ctx.fill();
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`Mức: ${g.diff.name}`, 45, 19.5);

  // ki + stamina
  const bar = (x: number, y: number, w: number, h: number, f: number, color: string) => {
    ctx.fillStyle = 'rgba(15,23,42,.8)'; ctx.beginPath(); ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 5); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, Math.max(0.01, w * f), h, 3); ctx.fill();
  };
  const full = g.ki[0] >= 100, blink = full && v.tick % 30 < 18;
  bar(34, VH - 20, 120, 9, g.ki[0] / 100, full ? (blink ? '#fff7ae' : '#ffb703') : '#f59e0b');
  bar(34, VH - 33, 120, 5, g.stamina / 100, '#4ade80');
  ctx.textAlign = 'left'; ctx.font = 'bold 11px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = '#0f172a';
  const label = (t: string, x: number, y: number, color: string) => { ctx.strokeText(t, x, y); ctx.fillStyle = color; ctx.fillText(t, x, y); };
  label('KI', 12, VH - 15, '#ffe14d'); label('🏃', 12, VH - 31, '#fff');
  if (full) label('⚡ Giữ SÚT thật lâu = TUYỆT CHIÊU!', 162, VH - 15, blink ? '#fff' : '#ffe14d');
  bar(VW - 80, 40, 66, 5, g.ki[1] / 100, g.ki[1] >= 100 ? '#ff6b6b' : '#fca5a5');
  // awakening stage of each side: three diamonds
  const pips = (x: number, y: number, n: number, on: string) => {
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < n ? on : 'rgba(15,23,42,.7)'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + i * 13, y - 5.5); ctx.lineTo(x + i * 13 + 5, y); ctx.lineTo(x + i * 13, y + 5.5); ctx.lineTo(x + i * 13 - 5, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  };
  label('THỨC TỈNH', 12, VH - 47, '#fff'); pips(82, VH - 47.5, g.awake[0], '#ffe14d');
  pips(VW - 40, 54, g.awake[1], '#ff6b6b');

  // radar
  const rw = 96, rh = 56, rx = VW - rw - 8, ry = VH - rh - 8;
  ctx.fillStyle = 'rgba(15,23,42,.6)'; ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx + rw / 2, ry); ctx.lineTo(rx + rw / 2, ry + rh); ctx.stroke();
  for (const p of g.ps) { ctx.fillStyle = p === g.ctl ? '#ffe14d' : p.side === 0 ? '#60a5fa' : '#f87171'; disc(ctx, rx + (p.x / W) * rw, ry + (p.y / H) * rh, p === g.ctl ? 2.6 : 2); }
  ctx.fillStyle = '#fff'; disc(ctx, rx + clamp(g.ball.x / W, 0, 1) * rw, ry + (g.ball.y / H) * rh, 1.8);

  // announcements
  ctx.textAlign = 'center';
  g.msgs.forEach((m, i) => {
    const age = m.max - m.ttl, s = 1 + Math.max(0, 1 - age / 9) * 0.7;
    ctx.save(); ctx.translate(VW / 2, 92 + i * 40); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, m.ttl / 14);
    ctx.font = '900 34px sans-serif'; ctx.lineWidth = 7; ctx.strokeStyle = '#0f172a'; ctx.lineJoin = 'round';
    ctx.strokeText(m.text, 0, 0); ctx.fillStyle = m.color; ctx.fillText(m.text, 0, 0); ctx.restore();
  });
  if (g.kick > 0 && g.phase === 'play') { ctx.font = '900 26px sans-serif'; ctx.lineWidth = 6; ctx.strokeStyle = '#0f172a'; ctx.strokeText('SẴN SÀNG…', VW / 2, 150); ctx.fillStyle = '#fff'; ctx.fillText('SẴN SÀNG…', VW / 2, 150); }
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}

export function draw(ctx: CanvasRenderingContext2D, g: Game, v: View, scale: number) {
  const b = g.ball, awayColor = g.level.color;
  v.tick++;
  if (v.cheer > 0) v.cheer--;
  const fx = clamp(b.x * 0.75 + g.ctl.x * 0.25 + b.vx * 10, 0, W), fy = b.y * 0.75 + g.ctl.y * 0.25;
  v.cx += (clamp(fx - VW / 2, -40, W - VW + 40) - v.cx) * 0.1;
  v.cy += (clamp(fy - VH / 2, -62, H - VH + 30) - v.cy) * 0.1;
  const sx = v.shake > 0.3 ? (Math.random() - 0.5) * v.shake * 2 : 0, sy = v.shake > 0.3 ? (Math.random() - 0.5) * v.shake * 2 : 0;
  v.shake *= 0.88;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.save();
  ctx.translate(Math.round(-v.cx + sx), Math.round(-v.cy + sy));
  drawStadium(ctx, v, awayColor);

  if (g.freeze > 0 && b.noP) { // special-shot wind-up: dim the pitch, speed lines around the shooter
    ctx.fillStyle = 'rgba(8,10,30,.55)'; ctx.fillRect(v.cx - 60, v.cy - 80, VW + 120, VH + 160);
    const s = b.noP, col = b.sup ? SUPERS[b.sup.kind].color : CHARS[s.ch].aura;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const a = i * 0.35 + v.tick * 0.05, r1 = 34 + ((v.tick * 6 + i * 17) % 40), r2 = r1 + 40; ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * r1, s.y - 8 + Math.sin(a) * r1); ctx.lineTo(s.x + Math.cos(a) * r2, s.y - 8 + Math.sin(a) * r2); ctx.stroke(); }
  }

  const ballDrawn = { v: false };
  for (const p of [...g.ps].sort((a, c) => a.y - c.y)) {
    if (!ballDrawn.v && b.y < p.y && b.z < 20) { drawBall(ctx, g, v); ballDrawn.v = true; }
    drawPlayer(ctx, g, p, v, awayColor);
  }
  if (!ballDrawn.v) drawBall(ctx, g, v);

  v.parts = v.parts.filter((p) => --p.life > 0);
  for (const p of v.parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.vx *= 0.96; p.vy *= 0.96;
    ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.6); ctx.fillStyle = p.color;
    if (p.grav) ctx.fillRect(p.x, p.y, p.size * 1.6, p.size); else disc(ctx, p.x, p.y, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (v.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${v.flash / 28})`; ctx.fillRect(0, 0, VW, VH); v.flash--; }
  hud(ctx, g, v);
}
