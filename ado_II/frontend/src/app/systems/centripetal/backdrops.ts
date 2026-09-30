import { COLORS, rng } from '../../ui/canvas-scene';

// Cenários ilustrados do sistema 2 (só o fundo e os objetos; trajetória, fio e
// vetores continuam sendo desenhados por cima pela cena).

export type StringBackdrop = 'ball' | 'sling' | 'hammer' | 'washer';
export type SurfaceKey = 'dry' | 'wet' | 'gravel' | 'snow' | 'ice';
export type VehicleKind = 'car' | 'moto' | 'truck' | 'kart';

interface Geometry {
  w: number;
  h: number;
  cx: number;
  cy: number;
  rPx: number; // raio da trajetória em px
  scale: number; // px por metro
}

// ---------------------------------------------------------------------------
// Objeto no fio
// ---------------------------------------------------------------------------

export function drawStringBackdrop(ctx: CanvasRenderingContext2D, kind: string, g: Geometry): boolean {
  switch (kind) {
    case 'ball':
      soccerField(ctx, g);
      return true;
    case 'sling':
      desert(ctx, g);
      return true;
    case 'hammer':
      throwingCircle(ctx, g);
      return true;
    case 'washer':
      washerDrum(ctx, g);
      return true;
    default:
      return false;
  }
}

// Gramado com faixas de corte e marcações do meio-campo.
function soccerField(ctx: CanvasRenderingContext2D, { w, h, cx, cy }: Geometry): void {
  ctx.fillStyle = '#4f9a3c';
  ctx.fillRect(0, 0, w, h);
  const band = 38;
  ctx.fillStyle = '#5aa846';
  for (let x = (cx % (2 * band)) - 2 * band; x < w; x += 2 * band) ctx.fillRect(x, 0, band, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(w, h) * 0.44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Areia com dunas e pedrinhas.
function desert(ctx: CanvasRenderingContext2D, { w, h }: Geometry): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ecd4a2');
  grad.addColorStop(1, '#dcbc83');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(170,125,60,0.35)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 7; k++) {
    const y0 = (h / 7) * k + 20;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = y0 + Math.sin(x / 70 + k * 1.7) * 10 + Math.sin(x / 23 + k) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const rand = rng(7);
  const stones = ['#a88f6a', '#8d7a5c', '#b9a27c', '#7c6a50'];
  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 1.5 + rand() * 4.5;
    ctx.fillStyle = 'rgba(90,60,20,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 1.5, y + 1.5, r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stones[i % stones.length];
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.75, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Círculo de arremesso de martelo (Ø 2,135 m, em escala), setor de 34,92° e gaiola.
function throwingCircle(ctx: CanvasRenderingContext2D, { w, h, cx, cy, rPx, scale }: Geometry): void {
  ctx.fillStyle = '#3f7f3a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#468a40';
  for (let y = 0; y < h; y += 60) ctx.fillRect(0, y, w, 30);

  // Linhas do setor, abrindo para a direita
  const half = (34.92 / 2) * (Math.PI / 180);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  for (const a of [-half, half]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * w, cy - Math.sin(a) * w);
    ctx.stroke();
  }

  // Gaiola de proteção (rede), aberta na direção do setor
  ctx.strokeStyle = 'rgba(30,30,30,0.45)';
  ctx.lineWidth = 7;
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, rPx * 1.28, 0.55, Math.PI * 2 - 0.55);
  ctx.stroke();
  ctx.setLineDash([]);

  // Círculo de concreto
  const cr = 1.0675 * scale;
  ctx.fillStyle = '#b9b6ae';
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// Tambor de máquina de lavar visto de frente: inox perfurado, pás e um pouco de água.
function washerDrum(ctx: CanvasRenderingContext2D, { w, h, cx, cy, rPx }: Geometry): void {
  ctx.fillStyle = '#dfe3e7';
  ctx.fillRect(0, 0, w, h);

  const dR = rPx * 1.22;
  ctx.strokeStyle = '#4f555b';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, dR + 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, dR, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createRadialGradient(cx - dR * 0.3, cy - dR * 0.3, dR * 0.1, cx, cy, dR);
  grad.addColorStop(0, '#dde1e5');
  grad.addColorStop(1, '#8f969e');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - dR, cy - dR, 2 * dR, 2 * dR);

  ctx.fillStyle = 'rgba(70,78,86,0.55)';
  const step = 14;
  for (let y = cy - dR; y < cy + dR; y += step) {
    for (let x = cx - dR + ((y / step) % 2) * (step / 2); x < cx + dR; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(80,150,220,0.28)';
  ctx.fillRect(cx - dR, cy + dR * 0.55, 2 * dR, dR);
  ctx.restore();

  // Pás internas
  ctx.fillStyle = '#b3b9bf';
  ctx.strokeStyle = '#6f777f';
  ctx.lineWidth = 1;
  for (const deg of [90, 210, 330]) {
    const a = (deg * Math.PI) / 180;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * dR * 0.9, cy - Math.sin(a) * dR * 0.9);
    ctx.rotate(-a);
    ctx.beginPath();
    ctx.roundRect(-dR * 0.14, -dR * 0.06, dR * 0.2, dR * 0.12, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Carro na curva: pista conforme o atrito
// ---------------------------------------------------------------------------

// Superfície visual a partir do μs (faixas em torno dos valores típicos de cada pista).
export function surfaceFromMu(mu: number): SurfaceKey {
  if (mu >= 0.65) return 'dry';
  if (mu >= 0.42) return 'wet';
  if (mu >= 0.27) return 'gravel';
  if (mu >= 0.14) return 'snow';
  return 'ice';
}

const GROUND: Record<SurfaceKey, string> = {
  dry: '#6aa04f',
  wet: '#4d7f45',
  gravel: '#a9a66d',
  snow: '#e8eef3',
  ice: '#e3ecf2',
};

const ROAD: Record<SurfaceKey, string> = {
  dry: '#565b61',
  wet: '#393e44',
  gravel: '#9a7b57',
  snow: '#dde4ea',
  ice: '#b7dcee',
};

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  surface: SurfaceKey,
  g: Geometry,
  halfPx: number,
): void {
  const { w, h, cx, cy, rPx } = g;
  const rand = rng(11);

  ctx.fillStyle = GROUND[surface];
  ctx.fillRect(0, 0, w, h);

  // Textura do entorno: tufos de grama ou sombras na neve
  if (surface === 'snow' || surface === 'ice') {
    ctx.fillStyle = 'rgba(150,175,200,0.18)';
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.ellipse(rand() * w, rand() * h, 20 + rand() * 40, 6 + rand() * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = surface === 'gravel' ? 'rgba(120,110,50,0.4)' : 'rgba(30,70,25,0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 160; i++) {
      const x = rand() * w;
      const y = rand() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y - 5);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 5);
      ctx.stroke();
    }
  }

  const ring = (r: number, color: string, width: number, dash: number[] = []) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  ring(rPx, ROAD[surface], 2 * halfPx);

  switch (surface) {
    case 'dry':
      ring(rPx - halfPx * 0.85, 'rgba(255,255,255,0.85)', 2);
      ring(rPx + halfPx * 0.85, 'rgba(255,255,255,0.85)', 2);
      ring(rPx, '#f2c230', 2, [14, 12]);
      break;

    case 'wet':
      ring(rPx, 'rgba(170,200,230,0.16)', halfPx * 1.2);
      ring(rPx - halfPx * 0.85, 'rgba(255,255,255,0.6)', 2);
      ring(rPx + halfPx * 0.85, 'rgba(255,255,255,0.6)', 2);
      ring(rPx, 'rgba(242,194,48,0.7)', 2, [14, 12]);
      // Poças
      for (let i = 0; i < 9; i++) {
        const a = rand() * Math.PI * 2;
        const rr = rPx + (rand() - 0.5) * halfPx;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * rr, cy - Math.sin(a) * rr);
        ctx.rotate(-a + Math.PI / 2);
        ctx.fillStyle = 'rgba(150,185,215,0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 0, halfPx * (0.5 + rand() * 0.6), halfPx * (0.2 + rand() * 0.2), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;

    case 'gravel':
      ring(rPx - halfPx * 0.4, 'rgba(90,65,40,0.35)', 3);
      ring(rPx + halfPx * 0.4, 'rgba(90,65,40,0.35)', 3);
      for (let i = 0; i < 220; i++) {
        const a = rand() * Math.PI * 2;
        const rr = rPx + (rand() - 0.5) * 2 * halfPx * 0.95;
        ctx.fillStyle = ['#7d6446', '#b39673', '#6b5a45', '#c4ab88'][i % 4];
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy - Math.sin(a) * rr, 1 + rand() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'snow':
      ring(rPx - halfPx * 0.35, 'rgba(110,125,145,0.35)', 4);
      ring(rPx + halfPx * 0.35, 'rgba(110,125,145,0.35)', 4);
      ring(rPx - halfPx, '#ffffff', 6);
      ring(rPx + halfPx, '#ffffff', 6);
      break;

    case 'ice':
      // Brilho e rachaduras
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = rand() * Math.PI * 2;
        const rr = rPx + (rand() - 0.5) * halfPx;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, a, a + 0.08 + rand() * 0.15);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(70,120,150,0.55)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const a = rand() * Math.PI * 2;
        let rr = rPx + (rand() - 0.5) * halfPx * 1.4;
        let ang = a;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * rr, cy - Math.sin(ang) * rr);
        for (let k = 0; k < 4; k++) {
          ang += (rand() - 0.3) * 0.04;
          rr += (rand() - 0.5) * halfPx * 0.5;
          ctx.lineTo(cx + Math.cos(ang) * rr, cy - Math.sin(ang) * rr);
        }
        ctx.stroke();
      }
      break;
  }
}

// Chuva (pista molhada) ou neve caindo (pista com neve), animadas pelo relógio real.
export function drawWeather(ctx: CanvasRenderingContext2D, surface: SurfaceKey, w: number, h: number, now: number): void {
  if (surface === 'wet') {
    const rand = rng(21);
    ctx.strokeStyle = 'rgba(190,215,240,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 110; i++) {
      const sx = rand();
      const sy = rand();
      const v = 0.7 + rand() * 0.5;
      const y = (sy * (h + 40) + now * 0.9 * v) % (h + 40) - 20;
      const x = (((sx * (w + 40) - now * 0.25 * v) % (w + 40)) + w + 40) % (w + 40) - 20;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 14);
    }
    ctx.stroke();
  } else if (surface === 'snow') {
    const rand = rng(31);
    for (let i = 0; i < 80; i++) {
      const sx = rand();
      const sy = rand();
      const r = 1.2 + rand() * 2.2;
      const y = (sy * (h + 20) + now * 0.035 * (0.6 + r / 3)) % (h + 20) - 10;
      const x = sx * w + Math.sin(now / 900 + i) * 8;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(110,130,150,0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Veículos (vista de cima). O eixo +x local é a frente do veículo.
// ---------------------------------------------------------------------------

export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  heading: number,
  len: number,
  skid: boolean,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-heading);
  switch (kind as VehicleKind) {
    case 'moto':
      moto(ctx, len * 0.7);
      break;
    case 'truck':
      truck(ctx, len * 1.9);
      break;
    case 'kart':
      kart(ctx, len * 0.65);
      break;
    default:
      car(ctx, len);
  }
  if (skid) {
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(0, 0, len * (kind === 'truck' ? 1.05 : 0.65), len * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function wheels(ctx: CanvasRenderingContext2D, pts: [number, number][], lw: number, ww: number): void {
  ctx.fillStyle = '#1b1b1b';
  for (const [x, y] of pts) ctx.fillRect(x - lw / 2, y - ww / 2, lw, ww);
}

function car(ctx: CanvasRenderingContext2D, len: number): void {
  const wid = len * 0.48;
  wheels(ctx, [[len * 0.3, -wid / 2], [len * 0.3, wid / 2], [-len * 0.3, -wid / 2], [-len * 0.3, wid / 2]], len * 0.2, len * 0.09);
  ctx.fillStyle = '#2a6fc9';
  ctx.beginPath();
  ctx.roundRect(-len / 2, -wid / 2, len, wid, len * 0.14);
  ctx.fill();
  ctx.fillStyle = '#4c8ce0';
  ctx.fillRect(-len * 0.2, -wid * 0.36, len * 0.36, wid * 0.72); // teto
  ctx.fillStyle = 'rgba(210,235,255,0.9)';
  ctx.fillRect(len * 0.16, -wid * 0.36, len * 0.14, wid * 0.72); // para-brisa
  ctx.fillRect(-len * 0.33, -wid * 0.32, len * 0.1, wid * 0.64); // vidro traseiro
  ctx.fillStyle = '#ffe08a';
  ctx.fillRect(len * 0.46, -wid * 0.42, len * 0.04, wid * 0.18); // faróis
  ctx.fillRect(len * 0.46, wid * 0.24, len * 0.04, wid * 0.18);
}

function moto(ctx: CanvasRenderingContext2D, len: number): void {
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.roundRect(len * 0.22, -len * 0.05, len * 0.28, len * 0.1, len * 0.05);
  ctx.roundRect(-len * 0.5, -len * 0.06, len * 0.3, len * 0.12, len * 0.05);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.roundRect(-len * 0.28, -len * 0.09, len * 0.56, len * 0.18, len * 0.08);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = Math.max(1.5, len * 0.04);
  ctx.beginPath();
  ctx.moveTo(len * 0.2, -len * 0.2);
  ctx.lineTo(len * 0.2, len * 0.2); // guidão
  ctx.stroke();
  ctx.fillStyle = '#f2f2f2';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-len * 0.02, 0, len * 0.13, 0, Math.PI * 2); // capacete
  ctx.fill();
  ctx.stroke();
}

function truck(ctx: CanvasRenderingContext2D, len: number): void {
  const wid = len * 0.24;
  const cab = len * 0.22;
  wheels(
    ctx,
    [
      [len * 0.4, -wid / 2], [len * 0.4, wid / 2],
      [-len * 0.05, -wid / 2], [-len * 0.05, wid / 2],
      [-len * 0.38, -wid / 2], [-len * 0.38, wid / 2],
    ],
    len * 0.08,
    len * 0.04,
  );
  ctx.fillStyle = '#e4e6e8'; // baú
  ctx.fillRect(-len / 2, -wid / 2, len - cab - len * 0.03, wid);
  ctx.fillStyle = '#d9602b';
  ctx.fillRect(-len / 2, -wid * 0.08, len - cab - len * 0.03, wid * 0.16);
  ctx.fillStyle = '#d9602b'; // cabine
  ctx.beginPath();
  ctx.roundRect(len / 2 - cab, -wid / 2, cab, wid, len * 0.03);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,235,255,0.9)';
  ctx.fillRect(len / 2 - cab * 0.35, -wid * 0.38, cab * 0.18, wid * 0.76);
}

function kart(ctx: CanvasRenderingContext2D, len: number): void {
  const wid = len * 0.62;
  wheels(ctx, [[len * 0.32, -wid / 2], [len * 0.32, wid / 2], [-len * 0.32, -wid / 2], [-len * 0.32, wid / 2]], len * 0.24, len * 0.16);
  ctx.fillStyle = '#16926a';
  ctx.beginPath();
  ctx.roundRect(-len * 0.42, -wid * 0.3, len * 0.9, wid * 0.6, len * 0.1);
  ctx.fill();
  ctx.fillStyle = '#f2c230';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-len * 0.08, 0, len * 0.16, 0, Math.PI * 2); // capacete
  ctx.fill();
  ctx.stroke();
}
