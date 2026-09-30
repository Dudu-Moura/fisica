import { Component, computed, effect, inject, signal } from '@angular/core';
import type { DragModel, DragRequest } from '@ado-ii/shared';
import { ApiService } from '../../core/api.service';
import { SoundService } from '../../core/sound.service';
import { fmt } from '../../core/format';
import { PlaybackService, interpolateAt } from '../../core/playback.service';
import { createSimulation } from '../../core/simulation';
import { type ChartSeries, LineChart } from '../../ui/line-chart';
import { ParamSlider } from '../../ui/param-slider';
import { PlaybackControls } from '../../ui/playback-controls';
import { DragScene } from './drag-scene';
import { DRAG_PRESETS, type DragPreset } from './presets';

const MODEL_LABEL: Record<DragModel, string> = { linear: 'linear', quadratic: 'quadrático' };

@Component({
  selector: 'app-drag',
  imports: [ParamSlider, LineChart, PlaybackControls, DragScene],
  providers: [PlaybackService],
  templateUrl: './drag.html',
})
export class Drag {
  private readonly api = inject(ApiService);
  private readonly playback = inject(PlaybackService);
  private readonly sound = inject(SoundService);
  protected readonly fmt = fmt;
  protected readonly presets = DRAG_PRESETS;
  protected readonly modelLabel = MODEL_LABEL;

  protected readonly model = signal<DragModel>('quadratic');
  protected readonly presetId = signal('skydiver');
  protected readonly mass = signal(80);
  protected readonly coefficient = signal(0.25);
  protected readonly compare = signal(false);
  protected readonly sceneId = signal('skydiver'); // último objeto real escolhido
  protected readonly icon = computed(() => DRAG_PRESETS.find((p) => p.id === this.sceneId())?.icon ?? '●');

  protected readonly preset = computed(() => DRAG_PRESETS.find((p) => p.id === this.presetId()) ?? null);
  protected readonly otherModel = computed<DragModel>(() => (this.model() === 'linear' ? 'quadratic' : 'linear'));
  protected readonly coefUnit = computed(() => (this.model() === 'linear' ? 'kg/s' : 'kg/m'));

  private readonly params = computed<DragRequest>(() => ({
    model: this.model(),
    mass: this.mass(),
    coefficient: this.coefficient(),
  }));

  // Mesmo m e mesmo coeficiente no outro modelo, na mesma janela de tempo (item 3 do relatório).
  private readonly otherParams = computed<DragRequest>(() => ({
    ...this.params(),
    model: this.otherModel(),
    duration: this.result()?.points.at(-1)?.t ?? 10,
  }));

  protected readonly sim = createSimulation(this.params, (req) => this.api.drag(req));
  protected readonly result = this.sim.result;
  protected readonly otherSim = createSimulation(this.otherParams, (req) => this.api.drag(req));

  protected readonly live = computed(() => {
    const r = this.result();
    return r?.points.length ? interpolateAt(r.points, this.playback.displayTime()) : null;
  });

  protected readonly velocitySeries = computed<ChartSeries[]>(() => {
    const r = this.result();
    if (!r) return [];
    const series: ChartSeries[] = [
      { label: `Com arrasto (${MODEL_LABEL[this.model()]})`, color: 'blue', points: r.points.map((p) => ({ x: p.t, y: p.v })) },
      { label: 'Queda livre v = gt', color: 'orange', points: r.points.map((p) => ({ x: p.t, y: p.vFree })) },
    ];
    const other = this.otherSim.result();
    if (this.compare() && other) {
      series.push({ label: `Com arrasto (${MODEL_LABEL[this.otherModel()]})`, color: 'aqua', points: other.points.map((p) => ({ x: p.t, y: p.v })) });
    }
    const t0 = r.points[0].t;
    const t1 = r.points[r.points.length - 1].t;
    series.push({
      label: 'v terminal',
      color: 'ink',
      dashed: true,
      marker: false,
      points: [{ x: t0, y: r.terminalVelocity }, { x: t1, y: r.terminalVelocity }],
    });
    return series;
  });

  protected readonly positionSeries = computed<ChartSeries[]>(() => {
    const r = this.result();
    if (!r) return [];
    const series: ChartSeries[] = [
      { label: `Com arrasto (${MODEL_LABEL[this.model()]})`, color: 'blue', points: r.points.map((p) => ({ x: p.t, y: p.y })) },
      { label: 'Queda livre y = ½gt²', color: 'orange', points: r.points.map((p) => ({ x: p.t, y: p.yFree })) },
    ];
    const other = this.otherSim.result();
    if (this.compare() && other) {
      series.push({ label: `Com arrasto (${MODEL_LABEL[this.otherModel()]})`, color: 'aqua', points: other.points.map((p) => ({ x: p.t, y: p.y })) });
    }
    return series;
  });

  constructor() {
    this.playback.holdAtEnd = 3; // espera 3 s com os dois objetos no chão antes de recomeçar
    effect(() => {
      const pts = this.result()?.points;
      if (pts?.length) this.playback.setDuration(pts[pts.length - 1].t);
    });
  }

  protected setModel(model: DragModel): void {
    this.sound.click();
    this.model.set(model);
    // Com um objeto real selecionado, troca para o coeficiente correspondente ao modelo.
    const p = this.preset();
    if (p) this.coefficient.set(model === 'linear' ? p.b : p.c);
  }

  protected applyPreset(preset: DragPreset): void {
    this.presetId.set(preset.id);
    this.sceneId.set(preset.id);
    this.mass.set(preset.mass);
    this.coefficient.set(this.model() === 'linear' ? preset.b : preset.c);
  }

  protected onPresetChange(event: Event): void {
    this.sound.click();
    const preset = DRAG_PRESETS.find((p) => p.id === (event.target as HTMLSelectElement).value);
    if (preset) this.applyPreset(preset);
    else this.presetId.set('custom');
  }

  protected touch(): void {
    this.presetId.set('custom');
  }
}
