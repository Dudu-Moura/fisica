import { Component, computed, inject, input, model } from '@angular/core';
import { fmt, fmtSig } from '../core/format';
import { SoundService } from '../core/sound.service';

const LOG_STEPS = 1000;

// Slider rotulado com valor e unidade. Com `log`, a escala é logarítmica
// (útil quando o parâmetro varia de 0,001 a 100, como massa e coeficiente de arrasto).
@Component({
  selector: 'app-param-slider',
  template: `
    <label class="slider">
      <span class="slider-head">
        <span class="slider-label">{{ label() }}</span>
        <span class="slider-value">{{ display() }} <small>{{ unit() }}</small></span>
      </span>
      <input
        type="range"
        [min]="log() ? 0 : min()"
        [max]="log() ? steps : max()"
        [step]="log() ? 1 : step()"
        [value]="position()"
        [disabled]="disabled()"
        (input)="onInput($event)"
      />
    </label>
  `,
})
export class ParamSlider {
  readonly label = input.required<string>();
  readonly unit = input('');
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(0.01);
  readonly digits = input(2);
  readonly log = input(false);
  readonly disabled = input(false);
  readonly value = model.required<number>();

  protected readonly steps = LOG_STEPS;
  private readonly sound = inject(SoundService);

  protected readonly display = computed(() =>
    this.log() ? fmtSig(this.value(), 3) : fmt(this.value(), this.digits()),
  );

  protected readonly position = computed(() => {
    if (!this.log()) return this.value();
    const lo = Math.log10(this.min());
    const hi = Math.log10(this.max());
    return Math.round(((Math.log10(this.value()) - lo) / (hi - lo)) * LOG_STEPS);
  });

  protected onInput(event: Event): void {
    this.sound.tick();
    const raw = Number((event.target as HTMLInputElement).value);
    if (!this.log()) {
      this.value.set(raw);
      return;
    }
    const lo = Math.log10(this.min());
    const hi = Math.log10(this.max());
    const v = 10 ** (lo + (raw / LOG_STEPS) * (hi - lo));
    this.value.set(Number(v.toPrecision(3)));
  }
}
