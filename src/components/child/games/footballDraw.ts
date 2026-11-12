// Canvas renderer for the football reward game: scrolling camera, cartoon sprites, particles, HUD.
import { CHARS, CHARGE_FULL, GY1, GY2, H, VH, VW, W, type Char, type Ev, type Game, type P } from '@/lib/football/sim';

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
    else if (e.t === 'goal') {
      for (let i = 0; i < 4; i++) burst(v, clamp(e.x, 20, W - 20) + (Math.random() - 0.5) * 120, e.y + (Math.random() - 0.5) * 120, 18, CONFETTI, 4.5, 80, 3.2, 0.06);
      v.shake = 11; v.cheer = 170; v.flash = 14;
    }
  }
}

const poly = (ctx: CanvasRenderingContext2D, pts: number[][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); };
const disc = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
const cap = (ctx: CanvasRenderingContext2D) => { ctx.beginPath(); ctx.arc(0, -16, 7.9, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); };

function drawHair(ctx: CanvasRenderingContext2D, c: Char, fx: number) {
  ctx.fillStyle = c.hair;
  switch (c.style) {
    case 'spiky': cap(ctx); poly(ctx, [[-7.5, -17], [-11, -25], [-5.5, -22], [-3.5, -31], [0, -23], [4, -31], [5.5, -22], [11, -25], [7.5, -17]]); break;
    case 'mohawk': cap(ctx); poly(ctx, [[-2.6, -19], [-3.2, -30], [0, -33], [3.2, -30], [2.6, -19]]); break;
    case 'long': cap(ctx); ctx.fillRect(-9, -17, 3.2, 13); ctx.fillRect(5.8, -17, 3.2, 13); break;
    case 'band': cap(ctx); ctx.fillStyle = c.aura; ctx.fillRect(-7.8, -19.5, 15.6, 2.4); ctx.fillRect(fx >= 0 ? -11 : 7, -19, 4, 1.6); break;
    case 'cap': cap(ctx); ctx.fillRect(fx >= 0 ? 1 : -11, -17.6, 10, 2.6); ctx.fillStyle = c.aura; disc(ctx, 0, -23.5, 1.4); break;
    case 'bun': cap(ctx); disc(ctx, 0, -25.5, 3.6); break;
    case 'curly': [[-6, -19, 3.6], [-2, -22.5, 4], [3, -22.5, 4], [6.5, -19, 3.6], [-8, -15, 2.6], [8, -15, 2.6]].forEach(([x, y, r]) => disc(ctx, x, y, r)); break;
    case 'hood': break; // drawn behind the head
  }
}

export interface Pose { fx: number; fy: number; shirt: string; gk?: boolean; side?: 0 | 1; tick: number; moving?: boolean; down?: boolean; slide?: boolean; kick?: boolean; cheer?: boolean; dive?: number; aura?: boolean; sprint?: boolean }

export function drawChar(ctx: CanvasRenderingContext2D, c: Char, x: number, y: number, o: Pose, scale = 1.45) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 10, 8.5, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  if (o.aura) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = c.aura + ['33', '44', '66'][i];
      ctx.beginPath(); ctx.ellipse(Math.sin(o.tick * 0.5 + i) * 1.5, -9 - i * 2, 15 - i * 3, 22 - i * 4 + Math.sin(o.tick * 0.7 + i * 2) * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  const ph = o.tick * (o.sprint ? 0.55 : 0.4), sw = o.moving ? Math.sin(ph) : 0;
  if (o.down) { ctx.translate(0, 6); ctx.rotate(o.fx >= 0 ? -Math.PI / 2 : Math.PI / 2); ctx.translate(0, 6); }
  else if (o.slide) { ctx.translate(0, 4); ctx.rotate(o.fx >= 0 ? -1.15 : 1.15); }
  else if (o.dive) { ctx.translate(0, 2); ctx.rotate(o.dive * 1.05); }
  else if (o.cheer) ctx.translate(0, -Math.abs(Math.sin(o.tick * 0.28)) * 6);
  else if (o.moving) ctx.translate(0, Math.abs(sw) * -1.2);

  // legs + boots
  const leg = (lx: number, len: number) => { ctx.fillStyle = c.skin; ctx.fillRect(lx, 4, 3.2, len); ctx.fillStyle = '#1f2937'; ctx.fillRect(lx - 0.4, 4 + len - 1.6, 4, 2.2); };
  if (o.kick && !o.down) {
    leg(-4.2, 6);
    ctx.save(); ctx.translate(1.5, 5); ctx.rotate(o.fx >= 0 ? -1.1 : 1.1); ctx.fillStyle = c.skin; ctx.fillRect(-1.6, 0, 3.2, 7); ctx.fillStyle = '#1f2937'; ctx.fillRect(-2, 5.4, 4, 2.2); ctx.restore();
  } else { leg(-4.2, 6 + sw * 2.4); leg(1, 6 - sw * 2.4); }
  // shorts, shirt, arms
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(-5.4, 1, 10.8, 4.6);
  ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.roundRect(-6.2, -9.5, 12.4, 11.5, 2.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-1.2, -9.5, 2.4, 11.5);
  const armUp = o.cheer || !!o.dive;
  for (const s of [-1, 1]) {
    const ax = s * 7.6 - 1.5, ay = armUp ? -17 : -8.5 + (s > 0 ? sw : -sw) * 1.6;
    ctx.fillStyle = o.shirt; ctx.fillRect(ax, armUp ? -13 : -8.5, 3, armUp ? 5 : 5.5);
    ctx.fillStyle = o.gk ? '#ffffff' : c.skin; if (o.gk) disc(ctx, ax + 1.5, ay + (armUp ? 2 : 8), 2.6); else ctx.fillRect(ax, ay + (armUp ? 0 : 5.5), 3, 3.2);
  }
  // head
  if (c.style === 'hood') { ctx.fillStyle = c.hair; disc(ctx, 0, -15, 9.4); poly(ctx, [[-4, -23], [0, -29], [4, -23]]); }
  ctx.fillStyle = c.skin; disc(ctx, 0, -15, c.style === 'hood' ? 6.6 : 7.5);
  if (o.fy < -0.55 && !o.down) { ctx.fillStyle = c.hair; disc(ctx, 0, -15.4, 7.7); drawHair(ctx, c, o.fx); }
  else {
    drawHair(ctx, c, o.fx);
    const ex = o.fx * 2.3, ey = Math.max(0, o.fy) * 1.6;
    if (o.down) { ctx.strokeStyle = '#111'; ctx.lineWidth = 1; for (const s of [-3, 2.4]) { ctx.beginPath(); ctx.moveTo(s - 1.3 + ex, -16.3); ctx.lineTo(s + 1.3 + ex, -13.7); ctx.moveTo(s + 1.3 + ex, -16.3); ctx.lineTo(s - 1.3 + ex, -13.7); ctx.stroke(); } }
    else {
      ctx.fillStyle = '#111'; ctx.fillRect(-3.6 + ex, -16.4 + ey, 1.9, 2.8); ctx.fillRect(1.7 + ex, -16.4 + ey, 1.9, 2.8);
      if (o.cheer) { ctx.fillStyle = '#7a1f1f'; ctx.beginPath(); ctx.arc(ex, -11.6 + ey, 2.2, 0, Math.PI); ctx.fill(); }
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

function drawBall(ctx: CanvasRenderingContext2D, g: Game, v: View) {
  const b = g.ball, by = b.y - b.z * 0.85, speed = Math.hypot(b.vx, b.vy);
  const aura = b.sup ? CHARS[b.sup.ch].aura : '#ffffff';
  if (b.sup || speed > 7.5) { v.trail.push({ x: b.x, y: by }); if (v.trail.length > (b.sup ? 14 : 7)) v.trail.shift(); } else if (v.trail.length) v.trail.shift();
  if (b.sup?.kind === 'zigzag' && v.trail.length > 1) {
    ctx.strokeStyle = aura; ctx.lineWidth = 3; ctx.beginPath();
    v.trail.forEach((t, i) => (i ? ctx.lineTo(t.x + (i % 2 ? 4 : -4), t.y) : ctx.moveTo(t.x, t.y))); ctx.stroke();
  }
  v.trail.forEach((t, i) => { ctx.fillStyle = aura + Math.round((i / v.trail.length) * (b.sup ? 170 : 90) + 16).toString(16).padStart(2, '0'); disc(ctx, t.x, t.y, (b.sup ? 4 : 2) + i * (b.sup ? 0.9 : 0.4)); });
  if (b.sup?.kind === 'sky') { ctx.strokeStyle = aura; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.sup.x1, b.sup.y1, 10 + (v.tick % 20), 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = `rgba(0,0,0,${0.3 - Math.min(0.18, b.z * 0.002)})`; ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, 5 - Math.min(2, b.z * 0.03), 2.4, 0, 0, Math.PI * 2); ctx.fill();
  const r = 5 + Math.min(4, b.z * 0.035);
  if (b.sup) { ctx.fillStyle = aura + '88'; disc(ctx, b.x, by, r + 9 + Math.sin(v.tick * 0.8) * 2); ctx.fillStyle = aura; disc(ctx, b.x, by, r + 4); }
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
    aura: (g.ki[p.side] >= 100 && g.ball.owner === p) || (g.freeze > 0 && g.ball.noP === p), sprint: p.sprint,
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
    const s = b.noP, col = CHARS[s.ch].aura;
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
