import { Component, effect, inject, input } from '@angular/core';
import type { CentripetalMode, CentripetalResponse } from '@ado-ii/shared';
import { interpolateAt } from '../../core/playback.service';
import { SoundService } from '../../core/sound.service';
import { COLORS, CanvasScene, Viewport, arrow, chip, dimForTheme, font } from '../../ui/canvas-scene';
import { type SurfaceKey, drawRoad, drawStringBackdrop, drawVehicle, drawWeather } from './backdrops';

const ROAD_HALF = 0.12; // meia-largura da pista, em frações de R
const EXIT_FACTOR = 1.3;

// Vista de cima do MCU. A posição vem dos pontos x(t), y(t) calculados no backend.
@Component({
  selector: 'app-centripetal-scene',
  template: `<canvas #canvas class="scene" aria-label="Animação do movimento circular"></canvas>`,
})
export class CentripetalScene extends CanvasScene {
  readonly result = input.required<CentripetalResponse | null>();
  readonly mode = input.required<CentripetalMode>();
  readonly radius = input.required<number>();
  readonly speed = input.required<number>();
  readonly icon = input('●');
  readonly backdrop = input('custom'); // cenário do modo fio (id do objeto)
  readonly vehicle = input('car'); // veículo do modo carro
  readonly surface = input<SurfaceKey>('dry'); // pista do modo carro

  private readonly sound = inject(SoundService);
  private prevPhase = 0;
  private lastWhoosh = 0;

  constructor() {
    super();
    effect(() => {
      this.result();
      this.mode();
      this.backdrop();
      this.vehicle();
      this.surface();
      this.redraw();
    });
  }

  // Som: "zum" a cada volta (objeto no fio) ou pneu cantando no início da derrapagem.
  protected override onFrame(t: number): void {
    const r = this.result();
    if (!r || r.period <= 0) return;
    const R = this.radius();
    const skid = this.mode() === 'car' && r.skidding && r.maxSpeed;
    const cycle = skid ? this.skidCycle(R, R * (this.speed() / r.maxSpeed!) ** 2) : r.period;
    const phase = (t % cycle) / cycle;
    const wrapped = phase < this.prevPhase;
    this.prevPhase = phase;
    if (!wrapped) return;

    if (skid) {
      this.sound.screech();
    } else if (this.mode() === 'string') {
      // Limita a ~3 por segundo quando o giro é muito rápido.
      const now = performance.now();
      if (now - this.lastWhoosh < 330) return;
      this.lastWhoosh = now;
      this.sound.whoosh(Math.min(1, this.speed() / 25));
    }
  }

  protected draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const r = this.result();
    const R = this.radius();
    const car = this.mode() === 'car';
    const vp = new Viewport(w, h, { xmin: -1.35 * R, xmax: 1.35 * R, ymin: -1.35 * R, ymax: 1.35 * R });
    const cx = vp.x(0);
    const cy = vp.y(0);
    const rPx = R * vp.scale;

    const geo = { w, h, cx, cy, rPx, scale: vp.scale };

    // Cenário: pista conforme o atrito (carro) ou ambiente do objeto (fio)
    if (car) {
      drawRoad(ctx, this.surface(), geo, ROAD_HALF * rPx);
      drawWeather(ctx, this.surface(), w, h, performance.now());
      dimForTheme(ctx, w, h);
    } else if (drawStringBackdrop(ctx, this.backdrop(), geo)) {
      dimForTheme(ctx, w, h);
    }

    // Trajetória circular (tracejada, com contorno para aparecer sobre o cenário)
    if (!car) {
      ctx.strokeStyle = COLORS.surface;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = COLORS.inkStrong;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Centro
    ctx.fillStyle = COLORS.inkStrong;
    ctx.strokeStyle = COLORS.surface;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!r || r.points.length === 0) return;

    let pos = interpolateAt(r.points, t);
    let heading = Math.atan2(pos.y, pos.x) + Math.PI / 2; // direção da velocidade (tangente)
    let skidOut = false;

    // Derrapagem: o atrito máximo só sustenta uma curva de raio R' = v² / (μg) = R (v / v_max)².
    // O carro segue essa curva maior, tangente à pista no ponto inicial, e sai da pista.
    if (car && r.skidding && r.maxSpeed) {
      const rSkid = R * (this.speed() / r.maxSpeed) ** 2;
      const phi = (this.speed() * (t % this.skidCycle(R, rSkid))) / rSkid;
      pos = { t, x: R - rSkid + rSkid * Math.cos(phi), y: rSkid * Math.sin(phi) };
      heading = phi + Math.PI / 2;
      skidOut = Math.hypot(pos.x, pos.y) > R * (1 + ROAD_HALF);

      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(vp.x(R - rSkid), cy, rSkid * vp.scale, 0, -Math.PI, true);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const px = vp.x(pos.x);
    const py = vp.y(pos.y);

    // Fio (modo fio)
    if (!car) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = COLORS.surface;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.strokeStyle = COLORS.inkStrong;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineCap = 'butt';
    }

    // Vetores: velocidade (tangente) e força centrípeta (para o centro)
    const arrowLen = Math.min(0.55 * rPx, 90);
    arrow(ctx, px, py, px + arrowLen * Math.cos(heading), py - arrowLen * Math.sin(heading), COLORS.blue, 'v');
    if (!skidOut) {
      const toCenter = Math.atan2(-pos.y, -pos.x);
      arrow(
        ctx,
        px,
        py,
        px + arrowLen * Math.cos(toCenter),
        py - arrowLen * Math.sin(toCenter),
        COLORS.orange,
        car ? 'fₐ = Fc' : 'T = Fc',
        -22,
      );
    }

    // Objeto
    if (car) {
      drawVehicle(ctx, this.vehicle(), px, py, heading, Math.max(16, Math.min(0.17 * rPx, 38)), r.skidding);
    } else {
      ctx.font = `${Math.max(18, Math.min(0.14 * rPx, 34))}px system-ui, "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.icon(), px, py);
    }

    if (car && r.skidding) {
      chip(ctx, 'Derrapando! v > vₘₐₓ', 16, 24, { font: font(18, 600, true), color: COLORS.red });
    }
  }

  // Tempo até o carro derrapando se afastar EXIT_FACTOR·R do centro (depois a animação recomeça).
  private skidCycle(R: number, rSkid: number): number {
    const d = R - rSkid; // centro da curva de derrapagem
    const cos = ((EXIT_FACTOR * R) ** 2 - d * d - rSkid * rSkid) / (2 * d * rSkid);
    const phi = Math.abs(cos) <= 1 ? Math.acos(cos) : Math.PI;
    return (phi * rSkid) / this.speed() + 0.6;
  }
}
