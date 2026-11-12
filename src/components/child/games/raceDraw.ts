// Canvas renderer for the maths race: parallax scenery per island, the car, the rival,
// and a different look for each of the ten power-ups.
import { ROAD_Y, TRACK, VH, VW, type Ev, type Power, type Race, type Theme } from '@/lib/race/sim';

const CAR_X = 210;                       // the car sits here; the world scrolls past it

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number; g: number }
export interface View { tick: number; parts: Part[]; banner: { text: string; sub: string; color: string; ttl: number } | null; shake: number }
export const newView = (): View => ({ tick: 0, parts: [], banner: null, shake: 0 });

const disc = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const poly = (c: CanvasRenderingContext2D, pts: number[][]) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };

function burst(v: View, x: number, y: number, n: number, color: string, sp: number, life = 26, r = 2.6, g = 0.08) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = sp * (0.3 + Math.random() * 0.7);
    v.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life, max: life, c: color, r: r * (0.6 + Math.random() * 0.7), g });
  }
}

export function onEvents(v: View, evs: Ev[], carY: number) {
  for (const e of evs) {
    if (e.t === 'coin') burst(v, CAR_X + 30, carY - 10, 6, '#ffd21f', 2.4, 20, 2.4);
    else if (e.t === 'bump') { burst(v, CAR_X, carY + 8, 12, '#b08968', 2.8, 26, 3); v.shake = 7; }
    else if (e.t === 'right') burst(v, CAR_X, carY - 16, 8, '#7be07b', 2.6, 24, 2.6);
    else if (e.t === 'wrong') burst(v, CAR_X, carY - 10, 8, '#ff8a8a', 2.2, 22, 2.6);
    else if (e.t === 'power' && e.power) {
      burst(v, CAR_X, carY - 10, 26, e.power.color, 4.2, 40, 3.4, 0.03);
      v.banner = { text: `${e.power.emoji} ${e.power.name.toUpperCase()}!`, sub: e.power.blurb, color: e.power.color, ttl: 110 };
      v.shake = 5;
    }
  }
}

function sky(ctx: CanvasRenderingContext2D, t: Theme, v: View, x: number) {
  const g = ctx.createLinearGradient(0, 0, 0, ROAD_Y);
  g.addColorStop(0, t.sky[0]); g.addColorStop(1, t.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, ROAD_Y + 4);
  ctx.fillStyle = '#fff8d6'; disc(ctx, VW - 90, 62, 26);
  ctx.fillStyle = '#ffffffcc';
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 260 - x * 0.25) % (VW + 320) + VW + 320) % (VW + 320) - 160, cy = 40 + ((i * 37) % 60);
    const s = 0.7 + ((i * 13) % 7) / 10;
    ctx.beginPath(); ctx.ellipse(cx, cy, 34 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 22 * s, cy + 6 * s, 20 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 24 * s, cy + 5 * s, 22 * s, 11 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  // two parallax hill ranges
  for (const [k, col, h] of [[0.45, t.far, 80], [0.8, t.near, 52]] as const) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, ROAD_Y);
    for (let px = 0; px <= VW; px += 20) {
      const w = px + x * k;
      ctx.lineTo(px, ROAD_Y - h - Math.sin(w / 190) * h * 0.45 - Math.sin(w / 70) * h * 0.14);
    }
    ctx.lineTo(VW, ROAD_Y); ctx.closePath(); ctx.fill();
  }
}

function deco(ctx: CanvasRenderingContext2D, t: Theme, x: number) {
  for (let i = 0; i < 9; i++) {
    const wx = i * 180 - (x * 0.8) % 180 * 1;
    const px = ((wx % (VW + 200)) + VW + 200) % (VW + 200) - 100;
    const s = 0.8 + ((i * 7) % 5) / 10, y = ROAD_Y - 6;
    ctx.save(); ctx.translate(px, y); ctx.scale(s, s);
    if (t.deco === 'tree' || t.deco === 'pine') {
      ctx.fillStyle = '#6b4423'; ctx.fillRect(-3, -16, 6, 16);
      ctx.fillStyle = t.deco === 'pine' ? '#1f7a4a' : '#3fae4c';
      if (t.deco === 'pine') { poly(ctx, [[0, -54], [-15, -24], [15, -24]]); poly(ctx, [[0, -40], [-19, -12], [19, -12]]); }
      else disc(ctx, 0, -28, 17);
    } else if (t.deco === 'palm') {
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -22, 10, -40); ctx.stroke();
      ctx.fillStyle = '#43b968';
      for (const a of [-70, -30, 10, 50, 150, 200]) { ctx.save(); ctx.translate(10, -40); ctx.rotate((a * Math.PI) / 180); ctx.beginPath(); ctx.ellipse(0, -14, 6, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    } else if (t.deco === 'cactus') {
      ctx.fillStyle = '#3f9e52'; ctx.beginPath(); ctx.roundRect(-6, -40, 12, 40, 6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-18, -30, 10, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(-18, -30, 8, 20, 4); ctx.fill();
    } else if (t.deco === 'rock') {
      ctx.fillStyle = '#8c95a3'; poly(ctx, [[-18, 0], [-6, -26], [8, -14], [18, 0]]);
      ctx.fillStyle = '#ffffff'; poly(ctx, [[-6, -26], [-11, -16], [-2, -19], [1, -22]]);
    } else if (t.deco === 'city') {
      ctx.fillStyle = '#39415c'; ctx.fillRect(-16, -60, 32, 60);
      ctx.fillStyle = '#ffe9a8'; for (let w = 0; w < 3; w++) for (let h = 0; h < 4; h++) ctx.fillRect(-11 + w * 9, -54 + h * 13, 5, 7);
    } else {
      ctx.fillStyle = '#4a2f3f'; poly(ctx, [[-26, 0], [0, -46], [26, 0]]);
      ctx.fillStyle = '#ff7a1a'; poly(ctx, [[-8, -40], [0, -52], [8, -40]]);
    }
    ctx.restore();
  }
}

function road(ctx: CanvasRenderingContext2D, t: Theme, x: number) {
  ctx.fillStyle = t.ground; ctx.fillRect(0, ROAD_Y, VW, VH - ROAD_Y);
  ctx.fillStyle = t.road; ctx.fillRect(0, ROAD_Y, VW, 74);
  ctx.fillStyle = '#ffffff55'; ctx.fillRect(0, ROAD_Y, VW, 3);
  ctx.fillStyle = '#f2f2f2';
  const dash = ((x % 70) + 70) % 70;
  for (let i = -1; i < 12; i++) ctx.fillRect(i * 70 - dash, ROAD_Y + 36, 34, 5);
  ctx.fillStyle = t.ground; ctx.fillRect(0, ROAD_Y + 74, VW, VH - ROAD_Y - 74);
}

function items(ctx: CanvasRenderingContext2D, r: Race, v: View, off: number) {
  for (const it of r.items) {
    const px = it.x - off;
    if (it.gone || px < -40 || px > VW + 40) continue;
    const y = ROAD_Y + 30 - (it.y > 0 ? 64 : 0);
    if (it.kind === 'coin') {
      const bob = Math.sin(v.tick * 0.12 + it.x) * 3;
      ctx.fillStyle = '#ffd21f'; ctx.strokeStyle = '#a87c00'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? 4.5 : 10;
        const cx = px + Math.cos(a) * rr, cy = y + bob + Math.sin(a) * rr;
        if (i) ctx.lineTo(cx, cy); else ctx.moveTo(cx, cy);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (it.kind === 'rock') {
      ctx.fillStyle = '#7b8494'; poly(ctx, [[px - 14, y + 10], [px - 6, y - 8], [px + 7, y - 5], [px + 14, y + 10]]);
      ctx.fillStyle = '#9aa3b1'; poly(ctx, [[px - 6, y - 8], [px + 7, y - 5], [px, y + 1]]);
    } else {
      ctx.fillStyle = '#2b2440aa'; ctx.beginPath(); ctx.ellipse(px, y + 8, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b5aa6aa'; ctx.beginPath(); ctx.ellipse(px - 6, y + 7, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function car(ctx: CanvasRenderingContext2D, x: number, y: number, body: string, tick: number, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 16, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = body; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-30, 10); ctx.lineTo(-26, -4); ctx.lineTo(-12, -6);
  ctx.lineTo(-6, -18); ctx.lineTo(12, -18); ctx.lineTo(20, -6); ctx.lineTo(31, -2); ctx.lineTo(31, 10); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#cfe9fb'; poly(ctx, [[-5, -16], [11, -16], [17, -7], [-5, -7]]);
  ctx.fillStyle = '#ffe9a8'; disc(ctx, 29, 2, 3);
  ctx.fillStyle = '#1b1e24';
  for (const wx of [-16, 16]) { disc(ctx, wx, 11, 8); ctx.save(); ctx.translate(wx, 11); ctx.rotate(tick * 0.4); ctx.fillStyle = '#8a9099'; ctx.fillRect(-5.5, -1.4, 11, 2.8); ctx.fillRect(-1.4, -5.5, 2.8, 11); ctx.restore(); ctx.fillStyle = '#1b1e24'; }
  ctx.restore();
}

/** The look of whichever power-up is running. */
function powerFx(ctx: CanvasRenderingContext2D, p: Power, x: number, y: number, v: View) {
  const t = v.tick;
  switch (p.id) {
    case 'nimbus': {
      const bob = Math.sin(t * 0.18) * 3;
      ctx.fillStyle = '#ffe9a8';
      for (let i = 1; i <= 3; i++) disc(ctx, x - 44 - i * 24, y + 24 + bob + Math.sin(t * 0.2 + i) * 4, 13 - i * 2);  // wisps left behind
      ctx.fillStyle = '#ffd166';
      for (const [dx, dy, r] of [[-34, 22, 22], [-6, 27, 27], [26, 22, 22], [-20, 14, 18], [14, 15, 19]]) disc(ctx, x + dx, y + dy + bob, r);
      ctx.fillStyle = '#fff3c4';
      for (const [dx, dy, r] of [[-22, 16, 11], [8, 17, 12], [28, 20, 8]]) disc(ctx, x + dx, y + dy + bob, r);
      break;
    }
    case 'dragon': {
      ctx.strokeStyle = '#8f6bff'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x + 30, y); ctx.lineTo(x + 80, y - 12); ctx.stroke();
      ctx.save(); ctx.translate(x + 104, y - 16 + Math.sin(t * 0.2) * 5);
      ctx.fillStyle = '#7be07b'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 13, -0.2, 0, Math.PI * 2); ctx.fill();
      for (let i = 1; i < 5; i++) { ctx.fillStyle = i % 2 ? '#5ec96a' : '#7be07b'; disc(ctx, -26 - i * 15, Math.sin(t * 0.2 + i) * 7, 11 - i); }
      ctx.fillStyle = '#fff'; disc(ctx, 10, -4, 4); ctx.fillStyle = '#111'; disc(ctx, 11, -4, 2);
      ctx.fillStyle = '#ff6b35'; poly(ctx, [[22, 2], [44, -2], [22, 7]]);
      ctx.restore(); break;
    }
    case 'rocket':
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#ffb020' : '#ff6b35'; disc(ctx, x - 34 - i * 12, y + 2 + Math.sin(t + i) * 2, 10 - i * 2); }
      ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const sy = y - 18 + i * 9; ctx.beginPath(); ctx.moveTo(x - 50 - ((t * 9 + i * 30) % 90), sy); ctx.lineTo(x - 20 - ((t * 9 + i * 30) % 90), sy); ctx.stroke(); }
      break;
    case 'rainbow': {
      const cols = ['#ff6b6b', '#ffb020', '#ffe14d', '#7be07b', '#4cc9ff', '#b983ff'];
      cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 36, y + 18 + i * 6); ctx.quadraticCurveTo(x - 160, y + 4 + i * 6, x - 300, y + 50 + i * 6); ctx.stroke(); });
      break;
    }
    case 'lightning':
      ctx.fillStyle = '#ffe14d33'; disc(ctx, x, y, 48);
      for (const [w, col] of [[6, '#ffe14d'], [2.2, '#ffffff']] as const) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round';
        for (let i = 0; i < 6; i++) {
          const a = t * 0.3 + i * 1.05, r1 = 30, r2 = 56 + Math.sin(t * 0.4 + i) * 7;
          const mx = x + Math.cos(a) * ((r1 + r2) / 2) + Math.sin(a) * 9;
          ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.6);
          ctx.lineTo(mx, y + Math.sin(a) * ((r1 + r2) / 2) * 0.6);
          ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2 * 0.6); ctx.stroke();
        }
      }
      break;
    case 'wings': {
      const flap = Math.sin(t * 0.35) * 0.4;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(x - 4, y - 10); ctx.rotate(s * (0.55 + flap));
        ctx.fillStyle = '#f4fbff'; ctx.strokeStyle = '#6fc9ef'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-34, -26, -66, -8); ctx.quadraticCurveTo(-34, 10, 0, 0); ctx.fill(); ctx.stroke();
        for (let f = 1; f <= 3; f++) { ctx.beginPath(); ctx.moveTo(-10 * f, -2 * f); ctx.quadraticCurveTo(-20 * f, -4 * f, -22 * f, 2); ctx.stroke(); }
        ctx.restore();
      }
      break;
    }
    case 'shield':
      ctx.strokeStyle = '#7be07b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y - 2, 48 + Math.sin(t * 0.2) * 3, 34 + Math.sin(t * 0.2) * 2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#7be07b22'; ctx.beginPath(); ctx.ellipse(x, y - 2, 48, 34, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'magnet':
      ctx.strokeStyle = '#ff8fab'; ctx.lineWidth = 2.5;
      for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(x + 34, y - 4, 18 * i + ((t * 2) % 18), -0.9, 0.9); ctx.stroke(); }
      break;
    case 'freeze':
      ctx.fillStyle = '#8fd8ff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      for (let i = 0; i < 5; i++) ctx.fillText('❄', x - 60 + i * 34, 40 + ((t * 2 + i * 40) % (ROAD_Y - 20)));
      ctx.fillStyle = '#8fd8ff22'; ctx.fillRect(0, 0, VW, VH);
      break;
    case 'coinrain':
      ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      for (let i = 0; i < 9; i++) ctx.fillText('⭐', ((i * 97 + t * 3) % VW), 20 + ((t * 4 + i * 60) % (ROAD_Y - 10)));
      break;
  }
}

function hud(ctx: CanvasRenderingContext2D, r: Race, v: View) {
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  // progress rail with both cars
  const w = VW - 190, x0 = 16;
  ctx.fillStyle = 'rgba(15,23,42,.6)'; ctx.beginPath(); ctx.roundRect(x0 - 6, 12, w + 12, 22, 11); ctx.fill();
  ctx.fillStyle = '#ffffff33'; ctx.beginPath(); ctx.roundRect(x0, 20, w, 6, 3); ctx.fill();
  ctx.fillStyle = '#ff8a8a'; disc(ctx, x0 + w * Math.min(1, r.rx / TRACK), 23, 6);
  ctx.fillStyle = '#ffd21f'; disc(ctx, x0 + w * Math.min(1, r.x / TRACK), 23, 7);
  ctx.font = 'bold 14px sans-serif'; ctx.fillText('🏁', x0 + w + 4, 23);

  // streak meter: five lamps, the reason to keep answering right
  ctx.fillStyle = 'rgba(15,23,42,.6)'; ctx.beginPath(); ctx.roundRect(VW - 128, 12, 112, 22, 11); ctx.fill();
  ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#e2e8f0'; ctx.fillText('CHUỖI', VW - 120, 23);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < r.streak % 5 || (r.streak > 0 && r.streak % 5 === 0) ? '#ffd21f' : '#ffffff33';
    disc(ctx, VW - 76 + i * 12, 23, 4.5);
  }

  ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = 'rgba(15,23,42,.6)';
  ctx.beginPath(); ctx.roundRect(16, VH - 32, 150, 22, 10); ctx.fill();
  ctx.fillStyle = '#ffd21f'; ctx.fillText(`⭐ ${r.coins}`, 26, VH - 21);
  ctx.fillStyle = '#fff'; ctx.fillText(`${r.score} điểm`, 78, VH - 21);

  if (r.power) {                                   // power-up timer
    const p = r.power, f = r.powerT / p.dur;
    ctx.fillStyle = 'rgba(15,23,42,.7)'; ctx.beginPath(); ctx.roundRect(VW - 180, VH - 36, 164, 26, 12); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.roundRect(VW - 176, VH - 18, 156 * f, 5, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`${p.emoji} ${p.name}`, VW - 172, VH - 27);
  }

  if (v.banner) {                                  // power-up announcement
    const b = v.banner, age = 110 - b.ttl, s = 1 + Math.max(0, 1 - age / 8) * 0.5;
    ctx.save(); ctx.translate(VW / 2, 110); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, b.ttl / 20); ctx.textAlign = 'center';
    ctx.font = '900 30px sans-serif'; ctx.lineWidth = 7; ctx.strokeStyle = '#0f172a'; ctx.lineJoin = 'round';
    ctx.strokeText(b.text, 0, 0); ctx.fillStyle = b.color; ctx.fillText(b.text, 0, 0);
    ctx.font = 'bold 14px sans-serif'; ctx.strokeText(b.sub, 0, 24); ctx.fillStyle = '#fff'; ctx.fillText(b.sub, 0, 24);
    ctx.restore();
    if (--b.ttl <= 0) v.banner = null;
  }
  ctx.textBaseline = 'alphabetic';
}

export function draw(ctx: CanvasRenderingContext2D, r: Race, v: View, scale: number) {
  v.tick++;
  const off = r.x - CAR_X;
  const carY = ROAD_Y + 28 - r.fly * 110;
  const sx = v.shake > 0.3 ? (Math.random() - 0.5) * v.shake : 0;
  v.shake *= 0.86;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.save(); ctx.translate(sx, 0);
  sky(ctx, r.theme, v, off);
  deco(ctx, r.theme, off);
  road(ctx, r.theme, off);
  items(ctx, r, v, off);

  // finish line, once it is in view
  const fx = TRACK - off;
  if (fx < VW + 60) {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#1a1a1a'; ctx.fillRect(fx + j * 11, ROAD_Y + 2 + i * 9, 11, 9); }
    ctx.fillStyle = '#e85555'; ctx.fillRect(fx - 4, ROAD_Y - 96, 6, 100); ctx.fillRect(fx - 4, ROAD_Y - 96, 90, 20);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('ĐÍCH', fx + 8, ROAD_Y - 82);
  }

  const gap = (r.rx - r.x) * 0.9;                  // the rival, drawn relative to you…
  const rivalScreen = CAR_X + Math.max(-170, Math.min(gap, VW - CAR_X - 60));  // …but never off screen
  car(ctx, rivalScreen, ROAD_Y + 28, '#e85555', v.tick, 0.92);
  if (r.power?.id === 'freeze') { ctx.fillStyle = '#8fd8ff66'; ctx.beginPath(); ctx.roundRect(rivalScreen - 36, ROAD_Y - 2, 72, 48, 8); ctx.fill(); }
  if (gap > VW - CAR_X - 60) {                     // it is further ahead than it looks
    ctx.fillStyle = '#e85555'; poly(ctx, [[VW - 22, ROAD_Y + 6], [VW - 6, ROAD_Y + 14], [VW - 22, ROAD_Y + 22]]);
  }

  if (r.power) powerFx(ctx, r.power, CAR_X, carY, v);
  if (r.fly > 0.05) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(CAR_X, ROAD_Y + 40, 26 * (1 - r.fly * 0.4), 5, 0, 0, Math.PI * 2); ctx.fill(); }
  car(ctx, CAR_X, carY, '#2563eb', v.tick * (r.v / 2.6));
  if (r.slow > 0) { ctx.fillStyle = '#b08968'; for (let i = 0; i < 3; i++) disc(ctx, CAR_X - 30 - i * 10, carY + 10, 6 - i); }

  v.parts = v.parts.filter((p) => --p.life > 0);
  for (const p of v.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.g; ctx.globalAlpha = Math.min(1, p.life / p.max); ctx.fillStyle = p.c; disc(ctx, p.x, p.y, p.r); }
  ctx.globalAlpha = 1;
  ctx.restore();

  hud(ctx, r, v);
}
