import { DestroyRef, Directive, ElementRef, afterNextRender, effect, inject, viewChild } from '@angular/core';
import { PlaybackService } from '../core/playback.service';
import { ThemeService } from '../core/theme.service';

// Base das cenas animadas: cuida de tamanho/DPI do canvas e redesenha a cada
// quadro do relógio. A subclasse só implementa draw() e chama redraw() num
// effect() que leia seus inputs, para redesenhar quando os parâmetros mudam.
@Directive()
export abstract class CanvasScene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly playback = inject(PlaybackService);
  private ctx?: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private ready = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const canvas = this.canvasRef().nativeElement;
      this.ready = true;
      this.ctx = canvas.getContext('2d') ?? undefined;
      const observer = new ResizeObserver(() => {
        const dpr = window.devicePixelRatio || 1;
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        canvas.width = Math.round(this.width * dpr);
        canvas.height = Math.round(this.height * dpr);
        this.redraw();
      });
      observer.observe(canvas);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    const theme = inject(ThemeService);
    effect(() => {
      theme.dark();
      this.redraw();
    });

    const unsubscribe = this.playback.subscribe((t) => {
      if (this.ready) this.onFrame(t);
      this.redraw();
    });
    destroyRef.onDestroy(unsubscribe);
  }

  protected redraw(): void {
    const ctx = this.ctx;
    if (!ctx || this.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.draw(ctx, this.width, this.height, this.playback.time);
  }

  protected abstract draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void;

  // Chamado a cada avanço do relógio (não em redesenhos por resize/parâmetros).
  // Usado para disparar efeitos sonoros em eventos da animação.
  protected onFrame(_t: number): void {}
}

// Transformação mundo (metros, y para cima) → pixels, ajustando uma caixa ao canvas.
export class Viewport {
  readonly scale: number;
  private readonly ox: number;
  private readonly oy: number;

  constructor(
    w: number,
    h: number,
    private readonly box: { xmin: number; xmax: number; ymin: number; ymax: number },
    padding = 24,
  ) {
    const bw = box.xmax - box.xmin;
    const bh = box.ymax - box.ymin;
    this.scale = Math.min((w - 2 * padding) / bw, (h - 2 * padding) / bh);
    this.ox = (w - bw * this.scale) / 2;
    this.oy = (h + bh * this.scale) / 2;
  }

  x(wx: number): number {
    return this.ox + (wx - this.box.xmin) * this.scale;
  }

  y(wy: number): number {
    return this.oy - (wy - this.box.ymin) * this.scale;
  }
}

// Seta de força (x0,y0) → (x1,y1) em pixels, com rótulo na ponta.
export function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  label?: string,
  labelSide = 0, // desloca o rótulo perpendicularmente à seta (px)
): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 2) return;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const head = Math.min(10, len * 0.4);

  ctx.save();
  // Contorno claro/escuro por baixo, para a seta aparecer sobre qualquer cenário.
  ctx.strokeStyle = COLORS.surface;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - head * 0.6 * Math.cos(ang), y1 - head * 0.6 * Math.sin(ang));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(ang - 0.4), y1 - head * Math.sin(ang - 0.4));
  ctx.lineTo(x1 - head * Math.cos(ang + 0.4), y1 - head * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = font(16, 600, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lx = x1 + 14 * Math.cos(ang) - labelSide * Math.sin(ang);
    const ly = y1 + 14 * Math.sin(ang) + labelSide * Math.cos(ang);
    ctx.strokeStyle = COLORS.surface;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeText(label, lx, ly);
    ctx.fillStyle = color;
    ctx.fillText(label, lx, ly);
  }
  ctx.restore();
}

// Paletas do canvas. COLORS é mutado no lugar pelo ThemeService, então as cenas
// sempre desenham com o tema atual (elas leem COLORS a cada quadro).
export const LIGHT_COLORS = {
  surface: '#fdfbf5',
  ink: '#4a4740',
  inkStrong: '#1f1d1a',
  muted: '#8a857a',
  line: 'rgba(31,29,26,0.2)',
  fill: '#e9e2d0', // cunha, pista
  blue: '#2a6fc9',
  orange: '#d9602b',
  aqua: '#16926a',
  yellow: '#b07a0c',
  red: '#b3372b',
  violet: '#5b4bb5',
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  surface: '#1f2226',
  ink: '#c6c0b1',
  inkStrong: '#ece7da',
  muted: '#8f897b',
  line: 'rgba(236,231,218,0.2)',
  fill: '#2e3238',
  blue: '#3987e5',
  orange: '#e0703a',
  aqua: '#22a77a',
  yellow: '#d9a03a',
  red: '#e66767',
  violet: '#9085e9',
};

export type ColorRole = keyof typeof LIGHT_COLORS;

export const COLORS = { ...LIGHT_COLORS };

export function font(size: number, weight = 400, serif = false, mono = false): string {
  const family = mono
    ? "'IBM Plex Mono', ui-monospace, monospace"
    : serif
      ? "'EB Garamond', Georgia, serif"
      : "'IBM Plex Sans', system-ui, sans-serif";
  return `${serif ? 'italic ' : ''}${weight} ${size}px ${family}`;
}

// Texto com uma "etiqueta" de papel por trás, legível sobre qualquer cenário.
export function chip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { font?: string; color?: string; align?: CanvasTextAlign; pad?: number } = {},
): void {
  ctx.save();
  ctx.font = opts.font ?? font(12, 600);
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = 'middle';
  const pad = opts.pad ?? 4;
  const w = ctx.measureText(text).width;
  const x0 = ctx.textAlign === 'center' ? x - w / 2 : ctx.textAlign === 'right' ? x - w : x;
  const size = parseInt(ctx.font.match(/(\d+)px/)?.[1] ?? '12', 10);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = COLORS.surface;
  ctx.beginPath();
  ctx.roundRect(x0 - pad, y - size / 2 - pad + 1, w + 2 * pad, size + 2 * pad - 2, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = opts.color ?? COLORS.inkStrong;
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

// Gerador pseudoaleatório determinístico (mesma "paisagem" a cada quadro).
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Escurece o cenário ilustrado no tema escuro, para não ofuscar.
export function dimForTheme(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  if (COLORS.surface !== DARK_COLORS.surface) return;
  ctx.fillStyle = 'rgba(10,12,16,0.38)';
  ctx.fillRect(0, 0, w, h);
}
