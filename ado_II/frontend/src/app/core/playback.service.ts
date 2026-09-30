import { DestroyRef, Injectable, inject, signal } from '@angular/core';

type Listener = (t: number) => void;

// Relógio da animação. Cada sistema fornece a sua instância (providers do componente);
// cenas e gráficos se inscrevem para redesenhar a cada quadro, sem passar pela
// detecção de mudanças do Angular. As fórmulas já foram avaliadas no backend —
// aqui só percorremos o vetor de tempo retornado.
@Injectable()
export class PlaybackService {
  readonly playing = signal(true);
  readonly speed = signal(1);
  // Tempo atual publicado ~10x por segundo para os valores numéricos "ao vivo".
  readonly displayTime = signal(0);

  // Pausa no fim antes de recomeçar (s de relógio real). 0 = ciclo contínuo.
  holdAtEnd = 1;

  private duration = 0;
  private elapsed = 0;
  private lastFrame = 0;
  private lastPublish = 0;
  private frame = 0;
  private readonly listeners = new Set<Listener>();

  constructor() {
    const loop = (now: number) => {
      this.tick(now);
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
  }

  get time(): number {
    return Math.min(this.elapsed, this.duration);
  }

  setDuration(duration: number): void {
    this.duration = duration;
    if (this.elapsed > duration + this.holdAtEnd) this.elapsed = 0;
    this.emit(true);
  }

  restart(): void {
    this.elapsed = 0;
    this.playing.set(true);
    this.emit(true);
  }

  toggle(): void {
    this.playing.update((p) => !p);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.time);
    return () => this.listeners.delete(listener);
  }

  private tick(now: number): void {
    const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 0.1) : 0;
    this.lastFrame = now;
    if (!this.playing() || this.duration <= 0) return;

    const cycle = this.duration + this.holdAtEnd * this.speed();
    this.elapsed = (this.elapsed + dt * this.speed()) % cycle;
    this.emit();
  }

  private emit(forcePublish = false): void {
    const t = this.time;
    for (const listener of this.listeners) listener(t);

    const now = performance.now();
    if (forcePublish || now - this.lastPublish > 100) {
      this.lastPublish = now;
      this.displayTime.set(t);
    }
  }
}

// Estado em t interpolado linearmente entre as duas amostras vizinhas, para a animação
// ficar fluida mesmo quando as amostras estão espaçadas (ex.: MCU lento, período longo).
export function interpolateAt<P extends { t: number }>(points: P[], t: number): P {
  const n = points.length;
  const last = points[n - 1].t;
  if (n < 2 || last <= 0) return points[0];
  const f = Math.max(0, Math.min(1, t / last)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(f));
  const k = f - i;
  const a = points[i] as Record<string, unknown>;
  const b = points[i + 1] as Record<string, unknown>;
  const out: Record<string, unknown> = { ...a };
  for (const key of Object.keys(a)) {
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'number' && typeof vb === 'number') out[key] = va + (vb - va) * k;
  }
  return out as P;
}
