import { Component, computed, effect, inject, signal } from '@angular/core';
import { DEFAULT_GRAVITY, type InclinedPlaneRequest } from '@ado-ii/shared';
import { ApiService } from '../../core/api.service';
import { SoundService } from '../../core/sound.service';
import { fmt } from '../../core/format';
import { PlaybackService, interpolateAt } from '../../core/playback.service';
import { createSimulation } from '../../core/simulation';
import { type ChartSeries, LineChart } from '../../ui/line-chart';
import { ParamSlider } from '../../ui/param-slider';
import { PlaybackControls } from '../../ui/playback-controls';
import { InclinedPlaneScene } from './inclined-plane-scene';

@Component({
  selector: 'app-inclined-plane',
  imports: [ParamSlider, LineChart, PlaybackControls, InclinedPlaneScene],
  providers: [PlaybackService],
  templateUrl: './inclined-plane.html',
})
export class InclinedPlane {
  private readonly api = inject(ApiService);
  private readonly playback = inject(PlaybackService);
  private readonly sound = inject(SoundService);
  protected readonly fmt = fmt;
  protected readonly g = DEFAULT_GRAVITY;

  protected readonly m1 = signal(5);
  protected readonly m2 = signal(4);
  protected readonly angleDeg = signal(30);
  protected readonly muK = signal(0.2);
  protected readonly muS = signal(0.3);
  protected readonly sameMu = signal(true); // sugestão do enunciado: μs = μk

  private readonly params = computed<InclinedPlaneRequest>(() => ({
    m1: this.m1(),
    m2: this.m2(),
    angleDeg: this.angleDeg(),
    muK: this.muK(),
    muS: this.sameMu() ? this.muK() : this.muS(),
  }));

  protected readonly sim = createSimulation(this.params, (req) => this.api.inclinedPlane(req));
  protected readonly result = this.sim.result;

  // μ crítico previsto pela teoria: |F_motriz| = μs N  ⇒  μ = |F_motriz| / N
  protected readonly criticalMu = computed(() => {
    const r = this.result();
    return r && r.normalForce > 0 ? Math.abs(r.drivingForce) / r.normalForce : null;
  });

  protected readonly direction = computed(() => {
    const r = this.result();
    if (!r || r.state === 'static') return 'parado';
    return r.acceleration > 0 ? 'm₁ sobe o plano, m₂ desce' : 'm₁ desce o plano, m₂ sobe';
  });

  protected readonly live = computed(() => {
    const r = this.result();
    return r?.points.length ? interpolateAt(r.points, this.playback.displayTime()) : null;
  });

  protected readonly positionSeries = computed<ChartSeries[]>(() => {
    const pts = this.result()?.points ?? [];
    return [{ label: 'x(t)', color: 'blue', points: pts.map((p) => ({ x: p.t, y: p.x })) }];
  });

  protected readonly velocitySeries = computed<ChartSeries[]>(() => {
    const pts = this.result()?.points ?? [];
    return [{ label: 'v(t)', color: 'orange', points: pts.map((p) => ({ x: p.t, y: p.v })) }];
  });

  constructor() {
    // Sininho quando o sistema passa de parado para em movimento (ou vice-versa).
    let previousState: string | null = null;
    effect(() => {
      const state = this.result()?.state ?? null;
      if (previousState && state && state !== previousState) this.sound.chime(state === 'moving');
      previousState = state;
    });
    effect(() => {
      const pts = this.result()?.points;
      if (pts?.length) this.playback.setDuration(pts[pts.length - 1].t);
    });
  }
}
