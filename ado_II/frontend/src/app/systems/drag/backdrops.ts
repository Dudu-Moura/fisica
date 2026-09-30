import { rng } from '../../ui/canvas-scene';

// Cenários ilustrados da queda (vista lateral). `bottom` é a linha do chão;
// a cena desenha régua, trajetórias e rótulos por cima.

interface Frame {
  w: number;
  h: number;
  bottom: number;
  now: number; // relógio real (ms), para nuvens/chuva
}

export function drawDragBackdrop(ctx: CanvasRenderingContext2D, kind: string, f: Frame): boolean {
  switch (kind) {
    case 'skydiver':
      sky(ctx, f, '#3f86cf', '#bfe0f7');
      clouds(ctx, f, 7, 0.012);
      farmland(ctx, f);
      return true;
    case 'parachute':
      sky(ctx, f, '#6fb1e6', '#e3f1fb');
      clouds(ctx, f, 4, 0.006);
      meadow(ctx, f);
      return true;
    case 'tennis':
      tennisCourt(ctx, f);
      return true;
    case 'bowling':
      bowlingAlley(ctx, f);
      return true;
    case 'rain':
      sky(ctx, f, '#4f5a66', '#9aa5b0');
      clouds(ctx, f, 5, 0.01, 'rgba(90,100,112,0.85)');
      rain(ctx, f);
      wetGround(ctx, f);
      return true;
    case 'paper':
      room(ctx, f);
      return true;
    default:
      return false;
  }
}

function sky(ctx: CanvasRenderingContext2D, { w, h }: Frame, top: string, bottom: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function clouds(ctx: CanvasRenderingContext2D, { w, bottom, now }: Frame, n: number, drift: number, color = 'rgba(255,255,255,0.7)'): void {
  const rand = rng(5);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const s = 0.6 + rand() * 0.9;
    const y = 40 + rand() * (bottom - 110);
    const x = ((rand() * (w + 200) + now * drift * s) % (w + 200)) - 100;
    for (const [dx, dy, r] of [[0, 0, 22], [22, -8, 26], [46, 0, 20], [24, 8, 22]] as const) {
      ctx.beginPath();
      ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Plantações vistas de longe: faixas de verdes e amarelos.
function farmland(ctx: CanvasRenderingContext2D, { w, h, bottom }: Frame): void {
  const colors = ['#6d9e3f', '#8fb04a', '#c9b458', '#5b8a3a', '#a3b95a'];
  const rand = rng(9);
  let x = 0;
  let i = 0;
  while (x < w) {
    const pw = 50 + rand() * 90;
    ctx.fillStyle = colors[i++ % colors.length];
    ctx.fillRect(x, bottom, pw + 1, h - bottom);
    x += pw;
  }
}

function meadow(ctx: CanvasRenderingContext2D, { w, h, bottom }: Frame): void {
  ctx.fillStyle = '#6aa04f';
  ctx.fillRect(0, bottom, w, h - bottom);
  const rand = rng(3);
  ctx.fillStyle = '#f2d14b';
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.arc(rand() * w, bottom + 5 + rand() * (h - bottom - 8), 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Muro do estádio com alambrado e saibro no chão.
function tennisCourt(ctx: CanvasRenderingContext2D, { w, h, bottom }: Frame): void {
  sky(ctx, { w, h, bottom, now: 0 }, '#8cc5ee', '#d8ecfa');
  const wallTop = bottom * 0.45;
  ctx.fillStyle = '#1f5a43';
  ctx.fillRect(0, wallTop, w, bottom - wallTop);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -bottom; x < w + bottom; x += 16) {
    ctx.moveTo(x, wallTop);
    ctx.lineTo(x + (bottom - wallTop), bottom);
    ctx.moveTo(x, bottom);
    ctx.lineTo(x + (bottom - wallTop), wallTop);
  }
  ctx.stroke();
  ctx.fillStyle = '#153f2f';
  ctx.fillRect(0, wallTop - 6, w, 6);

  ctx.fillStyle = '#c8643b';
  ctx.fillRect(0, bottom, w, h - bottom);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, bottom + 6, w, 2.5);
}

// Pista de boliche: fundo escuro com spots e piso de madeira com pinos.
function bowlingAlley(ctx: CanvasRenderingContext2D, { w, h, bottom }: Frame): void {
  ctx.fillStyle = '#1d1712';
  ctx.fillRect(0, 0, w, h);
  for (const fx of [0.2, 0.5, 0.8]) {
    const g = ctx.createRadialGradient(w * fx, 0, 5, w * fx, 0, bottom * 0.9);
    g.addColorStop(0, 'rgba(255,220,160,0.28)');
    g.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, bottom);
  }
  const floor = ctx.createLinearGradient(0, bottom, 0, h);
  floor.addColorStop(0, '#e2b579');
  floor.addColorStop(1, '#b98548');
  ctx.fillStyle = floor;
  ctx.fillRect(0, bottom, w, h - bottom);
  ctx.strokeStyle = 'rgba(120,75,30,0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  // Pinos no canto direito
  for (let i = 0; i < 4; i++) {
    const px = w - 60 + i * 12;
    const base = bottom;
    ctx.fillStyle = '#f7f4ee';
    ctx.beginPath();
    ctx.ellipse(px, base - 12, 4.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, base - 25, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(px - 3, base - 21, 6, 2);
  }
}

function rain(ctx: CanvasRenderingContext2D, { w, bottom, now }: Frame): void {
  const rand = rng(17);
  ctx.strokeStyle = 'rgba(210,225,240,0.5)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let i = 0; i < 120; i++) {
    const sx = rand();
    const sy = rand();
    const v = 0.8 + rand() * 0.4;
    const y = (sy * bottom + now * 0.7 * v) % bottom;
    const x = (((sx * w - now * 0.12 * v) % w) + w) % w;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y + 12);
  }
  ctx.stroke();
}

function wetGround(ctx: CanvasRenderingContext2D, { w, h, bottom }: Frame): void {
  ctx.fillStyle = '#3d4a3d';
  ctx.fillRect(0, bottom, w, h - bottom);
  ctx.fillStyle = 'rgba(160,185,210,0.45)';
  for (const fx of [0.25, 0.62, 0.86]) {
    ctx.beginPath();
    ctx.ellipse(w * fx, bottom + (h - bottom) / 2, 34, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Sala: papel de parede listrado, janela e piso de tábuas.
function room(ctx: CanvasRenderingContext2D, { w, h, bottom }: Frame): void {
  ctx.fillStyle = '#efe3c8';
  ctx.fillRect(0, 0, w, bottom);
  ctx.fillStyle = '#e6d6b4';
  for (let x = 0; x < w; x += 28) ctx.fillRect(x, 0, 12, bottom);

  const wx = w * 0.82;
  const wy = bottom * 0.12;
  const ww = Math.min(110, w * 0.14);
  const wh = bottom * 0.4;
  ctx.fillStyle = '#bfe0f7';
  ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeStyle = '#8a6a44';
  ctx.lineWidth = 5;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();

  ctx.fillStyle = '#9c6a3a';
  ctx.fillRect(0, bottom, w, h - bottom);
  ctx.strokeStyle = 'rgba(60,35,15,0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}
