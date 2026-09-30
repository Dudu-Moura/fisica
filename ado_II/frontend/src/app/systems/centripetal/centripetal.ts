import { Component, computed, effect, inject, signal } from '@angular/core';
import type { CentripetalMode, CentripetalRequest } from '@ado-ii/shared';
import { ApiService } from '../../core/api.service';
import { SoundService } from '../../core/sound.service';
import { fmt } from '../../core/format';
import { PlaybackService, interpolateAt } from '../../core/playback.service';
import { createSimulation } from '../../core/simulation';
import { type ChartSeries, LineChart } from '../../ui/line-chart';
import { ParamSlider } from '../../ui/param-slider';
import { PlaybackControls } from '../../ui/playback-controls';
import { CentripetalScene } from './centripetal-scene';
import { surfaceFromMu } from './backdrops';
import { CENTRIPETAL_PRESETS, type CentripetalPreset, SURFACES } from './presets';

@Component({
  selector: 'app-centripetal',
  imports: [ParamSlider, LineChart, PlaybackControls, CentripetalScene],
  providers: [PlaybackService],
  templateUrl: './centripetal.html',
})
export class Centripetal {
  private readonly api = inject(ApiService);
  private readonly playback = inject(PlaybackService);
  private readonly sound = inject(SoundService);
  protected readonly fmt = fmt;
  protected readonly surfaces = SURFACES;

  protected readonly mode = signal<CentripetalMode>('string');
  protected readonly presetId = signal<string>('ball');
  protected readonly mass = signal(0.45);
  protected readonly radius = signal(1);
  protected readonly speed = signal(4);
  protected readonly muS = signal(0.8);
  // Cenário/veículo do último objeto real escolhido (continua ao ajustar os sliders).
  protected readonly sceneId = signal('ball');
  protected readonly vehicleId = signal('car');
  protected readonly surface = computed(() => surfaceFromMu(this.muS()));

  protected readonly presets = computed(() => CENTRIPETAL_PRESETS.filter((p) => p.mode === this.mode()));
  protected readonly preset = computed(() => CENTRIPETAL_PRESETS.find((p) => p.id === this.presetId()) ?? null);
  protected readonly icon = computed(() => CENTRIPETAL_PRESETS.find((p) => p.id === this.sceneId())?.icon ?? '●');

  private readonly params = computed<CentripetalRequest>(() => ({
    mode: this.mode(),
    mass: this.mass(),
    radius: this.radius(),
    speed: this.speed(),
    muS: this.mode() === 'car' ? this.muS() : undefined,
  }));

  protected readonly sim = createSimulation(this.params, (req) => this.api.centripetal(req));
  protected readonly result = this.sim.result;

  protected readonly live = computed(() => {
    const r = this.result();
    return r?.points.length ? interpolateAt(r.points, this.playback.displayTime()) : null;
  });

  protected readonly trajectorySeries = computed<ChartSeries[]>(() => {
    const pts = this.result()?.points ?? [];
    return [
      { label: 'x(t) = R cos(ωt)', color: 'blue', points: pts.map((p) => ({ x: p.t, y: p.x })) },
      { label: 'y(t) = R sin(ωt)', color: 'orange', points: pts.map((p) => ({ x: p.t, y: p.y })) },
    ];
  });

  constructor() {
    this.playback.holdAtEnd = 0; // MCU é periódico: volta contínua
    effect(() => {
      const pts = this.result()?.points;
      if (pts?.length) this.playback.setDuration(pts[pts.length - 1].t);
    });
  }

  protected setMode(mode: CentripetalMode): void {
    if (mode === this.mode()) return;
    this.sound.click();
    this.mode.set(mode);
    this.applyPreset(CENTRIPETAL_PRESETS.find((p) => p.mode === mode)!);
  }

  protected applyPreset(preset: CentripetalPreset): void {
    this.presetId.set(preset.id);
    if (preset.mode === 'car') this.vehicleId.set(preset.id);
    else this.sceneId.set(preset.id);
    this.mass.set(preset.mass);
    this.radius.set(preset.radius);
    this.speed.set(preset.speed);
  }

  protected onPresetChange(event: Event): void {
    this.sound.click();
    const id = (event.target as HTMLSelectElement).value;
    const preset = CENTRIPETAL_PRESETS.find((p) => p.id === id);
    if (preset) this.applyPreset(preset);
    else this.presetId.set('custom');
  }

  protected onSurfaceChange(event: Event): void {
    this.sound.click();
    const surface = SURFACES.find((s) => s.key === (event.target as HTMLSelectElement).value);
    if (surface) this.muS.set(surface.muS);
  }

  // Mexer num slider transforma o cenário em "personalizado".
  protected touch(): void {
    this.presetId.set('custom');
  }
}
