import { Component, DestroyRef, computed, effect, inject, input } from '@angular/core';
import type { DragResponse } from '@ado-ii/shared';
import { fmt } from '../../core/format';
import { interpolateAt } from '../../core/playback.service';
import { SoundService } from '../../core/sound.service';
import { COLORS, CanvasScene, chip, dimForTheme, font } from '../../ui/canvas-scene';
import { drawDragBackdrop } from './backdrops';

// Duas quedas lado a lado, a partir do repouso e da MESMA altura H: com arrasto × no vácuo.
// H = distância que o objeto com arrasto percorre na janela simulada, então ele toca o
// chão no fim da janela; o objeto sem arrasto chega antes e fica parado no chão.
@Component({
  selector: 'app-drag-scene',
  template: `<canvas #canvas class="scene" aria-label="Animação da queda com e sem arrasto"></canvas>`,
})
export class DragScene extends CanvasScene {
  readonly result = input.required<DragResponse | null>();
  readonly icon = input('●');
  readonly backdrop = input('custom'); // cenário (id do objeto real)

  private readonly sound = inject(SoundService);
  private prevT = 0;

  // Altura de queda e instante em que o objeto sem arrasto toca o chão (y_livre = H).
  private readonly fall = computed(() => {
    const r = this.result();
    if (!r || r.points.length === 0) return null;
    const pts = r.points;
    const height = Math.max(pts[pts.length - 1].y, 1e-9);
    let landFree = pts[pts.length - 1].t;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].yFree >= height) {
        const a = pts[i - 1];
        const b = pts[i];
        landFree = a.t + ((height - a.yFree) / (b.yFree - a.yFree)) * (b.t - a.t);
        break;
      }
    }
    return { height, landFree, end: pts[pts.length - 1].t, impactFree: interpolateAt(pts, landFree).vFree };
  });

  constructor() {
    super();
    effect(() => {
      this.result();
      this.icon();
      this.backdrop();
      this.redraw();
    });
    effect(() => {
      if (!this.playback.playing()) this.sound.setWind(0);
    });
    inject(DestroyRef).onDestroy(() => this.sound.stopWind());
  }

  protected override onFrame(t: number): void {
    const r = this.result();
    const f = this.fall();
    if (!r || !f) return;
    if (t < this.prevT) this.prevT = 0; // recomeçou

    const vt = r.terminalVelocity;
    if (this.prevT < f.landFree && t >= f.landFree) this.sound.thud(0.5 + 0.5 * Math.min(1, f.impactFree / (2 * vt)));
    if (this.prevT < f.end && t >= f.end) this.sound.thud(0.45);

    // Vento proporcional à velocidade do objeto com arrasto enquanto ele cai.
    const falling = t > 0 && t < f.end;
    this.sound.setWind(falling ? 0.25 + 0.75 * (interpolateAt(r.points, t).v / vt) : 0);
    this.prevT = t;
  }

  protected draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const r = this.result();
    const f = this.fall();
    const top = 52;
    const bottom = h - 30;
    const lanes = [w * 0.34, w * 0.7];

    const themed = drawDragBackdrop(ctx, this.backdrop(), { w, h, bottom, now: performance.now() });
    if (themed) dimForTheme(ctx, w, h);

    chip(ctx, 'com arrasto', lanes[0], 24, { font: font(15, 600, true), align: 'center' });
    chip(ctx, 'sem arrasto (vácuo)', lanes[1], 24, { font: font(15, 600, true), align: 'center' });

    ctx.strokeStyle = themed ? 'rgba(255,255,255,0.45)' : COLORS.line;
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    for (const x of lanes) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Chão (hachurado, como em desenho técnico)
    ctx.strokeStyle = COLORS.inkStrong;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(56, bottom);
    ctx.lineTo(w - 16, bottom);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.muted;
    for (let x = 60; x < w - 16; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, bottom + 1);
      ctx.lineTo(x - 7, bottom + 8);
      ctx.stroke();
    }

    if (!r || !f) return;

    const p = interpolateAt(r.points, t);
    const toPx = (y: number) => top + (Math.min(y, f.height) / f.height) * (bottom - top);

    // Régua de altura (sobre uma faixa de papel, legível em qualquer cenário)
    ctx.globalAlpha = themed ? 0.8 : 0;
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, top - 30, 56, bottom - top + 38);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.ink;
    ctx.font = font(11, 400, false, true);
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = (f.height * i) / 4;
      const py = toPx(y);
      ctx.beginPath();
      ctx.moveTo(44, py);
      ctx.lineTo(52, py);
      ctx.stroke();
      ctx.fillText(fmt(f.height - y, f.height < 10 ? 1 : 0), 42, py + 4);
    }
    ctx.textAlign = 'left';
    ctx.fillText('h (m)', 8, top - 14);

    const size = Math.max(22, Math.min(w, h) * 0.08);
    const freeLanded = t >= f.landFree;
    const dragLanded = t >= f.end;
    this.drawBody(ctx, lanes[0], toPx(p.y), size, dragLanded ? null : p.v, r.terminalVelocity, dragLanded);
    this.drawBody(ctx, lanes[1], toPx(p.yFree), size, freeLanded ? null : p.vFree, null, freeLanded);

    const arrived = { font: font(12, 500), align: 'center' as const, color: COLORS.ink };
    if (freeLanded) chip(ctx, `chegou em ${fmt(f.landFree, 2)} s`, lanes[1], bottom + 17, arrived);
    if (dragLanded) chip(ctx, `chegou em ${fmt(f.end, 2)} s`, lanes[0], bottom + 17, arrived);
  }

  private drawBody(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    v: number | null,
    vt: number | null,
    landed: boolean,
  ): void {
    const cy = landed ? y - size * 0.5 : y;
    ctx.font = `${size}px system-ui, "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon(), x, cy);
    ctx.textBaseline = 'alphabetic';

    const lx = x + size * 0.75;
    if (v === null) {
      chip(ctx, 'no chão', lx, cy, { font: font(13, 600) });
      return;
    }
    chip(ctx, `${fmt(v, 1)} m/s`, lx, cy, { font: font(13, 600, false, true) });
    if (vt) chip(ctx, `${fmt((100 * v) / vt, 0)}% de vₜ`, lx, cy + 19, { font: font(11, 400, false, true), color: COLORS.ink });
  }
}
