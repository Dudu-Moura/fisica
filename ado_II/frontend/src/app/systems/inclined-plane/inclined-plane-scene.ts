import { Component, effect, inject, input } from '@angular/core';
import type { InclinedPlaneResponse } from '@ado-ii/shared';
import { interpolateAt } from '../../core/playback.service';
import { SoundService } from '../../core/sound.service';
import { COLORS, CanvasScene, Viewport, arrow, font } from '../../ui/canvas-scene';

// Dimensões do desenho em unidades de cena. O backend simula até |x| = 4 m;
// o deslocamento é reduzido por MOTION_SCALE para caber no plano desenhado.
const PLANE = 6;
const BLOCK = 0.7;
const PULLEY_R = 0.22;
const TRAVEL = 2.2; // deslocamento máximo desenhado
const MOTION_SCALE = TRAVEL / 4;
const HANG0 = TRAVEL + 0.4; // profundidade inicial de m2 abaixo da polia
const FORCE_LEN = 1.6; // comprimento da maior seta de força

@Component({
  selector: 'app-inclined-plane-scene',
  template: `<canvas #canvas class="scene" aria-label="Animação do plano inclinado"></canvas>`,
})
export class InclinedPlaneScene extends CanvasScene {
  readonly result = input.required<InclinedPlaneResponse | null>();
  readonly angleDeg = input.required<number>();
  readonly m1 = input.required<number>();
  readonly m2 = input.required<number>();
  readonly gravity = input(9.81);

  private readonly sound = inject(SoundService);
  private prevT = 0;

  constructor() {
    super();
    effect(() => {
      this.result();
      this.angleDeg();
      this.redraw();
    });
  }

  // Batida quando o bloco chega ao fim do trecho simulado (fim do plano ou da polia).
  protected override onFrame(t: number): void {
    const r = this.result();
    if (!r || r.state !== 'moving' || r.points.length < 2) return;
    if (t < this.prevT) this.prevT = 0;
    const end = r.points[r.points.length - 1];
    if (this.prevT < end.t && t >= end.t) this.sound.thud(Math.min(1, Math.abs(end.v) / 6));
    this.prevT = t;
  }

  protected draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const th = (this.angleDeg() * Math.PI) / 180;
    const u = { x: Math.cos(th), y: Math.sin(th) }; // ao longo do plano (subindo)
    const n = { x: -Math.sin(th), y: Math.cos(th) }; // normal ao plano
    const top = { x: PLANE * u.x, y: PLANE * u.y };

    const r = this.result();
    const x = (r && r.points.length ? interpolateAt(r.points, t).x : 0) * MOTION_SCALE;

    const s = clamp(PLANE / 2 + x, BLOCK / 2 + 0.2, PLANE - BLOCK / 2 - PULLEY_R - 0.3);
    const depth = clamp(HANG0 + x, 0.4, HANG0 + TRAVEL);

    const pulley = { x: top.x + n.x * (BLOCK / 2 - PULLEY_R), y: top.y + n.y * (BLOCK / 2 - PULLEY_R) };
    const hangX = pulley.x + PULLEY_R;

    const vp = new Viewport(w, h, {
      xmin: -0.4,
      xmax: hangX + BLOCK + 0.6,
      ymin: Math.min(-0.6, pulley.y - HANG0 - TRAVEL - BLOCK - 0.3),
      ymax: Math.max(top.y, pulley.y) + PULLEY_R + 0.9,
    });
    const P = (px: number, py: number): [number, number] => [vp.x(px), vp.y(py)];

    // Mesa + cunha (plano inclinado)
    ctx.fillStyle = COLORS.fill;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(...P(0, 0));
    ctx.lineTo(...P(top.x, top.y));
    ctx.lineTo(...P(top.x, 0));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(...P(-0.4, 0));
    ctx.lineTo(...P(top.x, 0));
    ctx.lineTo(...P(top.x, pulley.y - HANG0 - TRAVEL - BLOCK - 0.3));
    ctx.stroke();

    // Ângulo θ
    ctx.strokeStyle = COLORS.muted;
    ctx.beginPath();
    ctx.arc(vp.x(0), vp.y(0), 1.1 * vp.scale, -th, 0);
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(15, 500, true);
    ctx.fillText(`θ = ${this.angleDeg().toFixed(0)}°`, vp.x(1.25), vp.y(0.15));

    // Suporte da polia
    ctx.strokeStyle = COLORS.muted;
    ctx.beginPath();
    ctx.moveTo(...P(top.x, top.y));
    ctx.lineTo(...P(pulley.x, pulley.y));
    ctx.stroke();

    // Bloco m1
    const c1 = { x: s * u.x + n.x * (BLOCK / 2), y: s * u.y + n.y * (BLOCK / 2) };
    ctx.save();
    ctx.translate(vp.x(c1.x), vp.y(c1.y));
    ctx.rotate(-th);
    const b = BLOCK * vp.scale;
    ctx.fillStyle = COLORS.blue;
    roundRect(ctx, -b / 2, -b / 2, b, b, 4);
    ctx.fillStyle = '#fff';
    ctx.font = font(12, 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('m₁', 0, 0);
    ctx.restore();

    // Fio: bloco → polia → massa pendurada
    const ropeStart = { x: c1.x + u.x * (BLOCK / 2), y: c1.y + u.y * (BLOCK / 2) };
    const tangent = { x: pulley.x + n.x * PULLEY_R, y: pulley.y + n.y * PULLEY_R };
    const c2 = { x: hangX, y: pulley.y - depth - BLOCK / 2 };
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(...P(ropeStart.x, ropeStart.y));
    ctx.lineTo(...P(tangent.x, tangent.y));
    ctx.arc(vp.x(pulley.x), vp.y(pulley.y), PULLEY_R * vp.scale, -(Math.PI / 2 + th), 0);
    ctx.lineTo(...P(hangX, c2.y + BLOCK / 2));
    ctx.stroke();

    // Polia
    ctx.fillStyle = COLORS.surface;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vp.x(pulley.x), vp.y(pulley.y), PULLEY_R * vp.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Massa pendurada m2
    ctx.fillStyle = COLORS.orange;
    roundRect(ctx, vp.x(c2.x - BLOCK / 2), vp.y(c2.y + BLOCK / 2), b, b, 4);
    ctx.fillStyle = '#fff';
    ctx.font = font(12, 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('m₂', vp.x(c2.x), vp.y(c2.y));

    if (r) this.drawForces(ctx, vp, r, c1, c2, u, n);
  }

  // Diagrama de corpo livre: P, N, T e atrito em m1; P e T em m2 (em escala).
  private drawForces(
    ctx: CanvasRenderingContext2D,
    vp: Viewport,
    r: InclinedPlaneResponse,
    c1: { x: number; y: number },
    c2: { x: number; y: number },
    u: { x: number; y: number },
    n: { x: number; y: number },
  ): void {
    const g = this.gravity();
    const w1 = this.m1() * g;
    const w2 = this.m2() * g;
    const k = FORCE_LEN / Math.max(w1, w2, r.normalForce, r.tension, r.frictionForce, 1e-9);
    // Atrito sempre contrário à tendência de movimento (sinal de F_motriz).
    const fDir = -Math.sign(r.drivingForce);

    const vec = (o: { x: number; y: number }, d: { x: number; y: number }, mag: number, color: string, label: string) =>
      arrow(ctx, vp.x(o.x), vp.y(o.y), vp.x(o.x + d.x * mag * k), vp.y(o.y + d.y * mag * k), color, label);

    vec(c1, { x: 0, y: -1 }, w1, COLORS.ink, 'P₁');
    vec(c1, n, r.normalForce, COLORS.aqua, 'N');
    vec(c1, u, r.tension, COLORS.yellow, 'T');
    if (fDir !== 0) vec(c1, { x: u.x * fDir, y: u.y * fDir }, r.frictionForce, COLORS.red, 'fₐ');

    vec(c2, { x: 0, y: -1 }, w2, COLORS.ink, 'P₂');
    vec(c2, { x: 0, y: 1 }, r.tension, COLORS.yellow, 'T');
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
