import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'ado-ii-sound';

// Efeitos sonoros sintetizados com Web Audio (sem arquivos de áudio).
// O navegador só libera o áudio depois de um gesto do usuário; o contexto é
// criado/retomado no primeiro clique ou tecla.
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly enabled = signal(readPreference());

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private wind: { gain: GainNode; filter: BiquadFilterNode; source: AudioBufferSourceNode } | null = null;
  private lastTick = 0;

  constructor() {
    const unlock = () => {
      this.context();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  toggle(): void {
    const on = !this.enabled();
    this.enabled.set(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* armazenamento indisponível: preferência vale só nesta sessão */
    }
    if (!on) this.setWind(0);
    else this.click();
  }

  // Clique curto de interface (botões, menus).
  click(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.04);
    this.envelope(osc, t, 0.08, 0.05);
  }

  // "Tique" de régua ao arrastar um slider (limitado a ~16 por segundo).
  tick(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = performance.now();
    if (now - this.lastTick < 60) return;
    this.lastTick = now;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2600, t);
    this.envelope(osc, t, 0.025, 0.015);
  }

  // Impacto (bloco batendo, objeto chegando ao chão). intensity ∈ [0, 1].
  thud(intensity = 0.6): void {
    const ctx = this.ready();
    if (!ctx) return;
    const k = clamp(intensity, 0.15, 1);
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    this.envelope(osc, t, 0.5 * k, 0.3);

    const src = this.noiseSource(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    src.connect(lp);
    this.envelope(src, t, 0.25 * k, 0.12, lp);
  }

  // Zunido de ar passando (uma volta no MCU). intensity ∈ [0, 1].
  whoosh(intensity = 0.5): void {
    const ctx = this.ready();
    if (!ctx) return;
    const k = clamp(intensity, 0.1, 1);
    const t = ctx.currentTime;
    const src = this.noiseSource(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(300 + 1500 * k, t + 0.12);
    bp.frequency.exponentialRampToValueAtTime(250, t + 0.3);
    src.connect(bp);
    this.envelope(src, t, 0.35 * k, 0.32, bp, 0.1);
  }

  // Pneu cantando na derrapagem.
  screech(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = this.noiseSource(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 9;
    bp.frequency.setValueAtTime(2300, t);
    bp.frequency.linearRampToValueAtTime(1700, t + 0.7);
    src.connect(bp);
    this.envelope(src, t, 0.35, 0.8, bp, 0.05);
  }

  // Sininho curto (mudança de estado: parado ↔ em movimento).
  chime(up = true): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = up ? [660, 990] : [990, 660];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      this.envelope(osc, t + i * 0.08, 0.12, 0.35);
    });
  }

  // Vento contínuo e discreto: ruído marrom (grave, sem chiado) passando por um
  // passa-baixa. Volume e "abertura" do filtro crescem suavemente com `level` ∈ [0, 1].
  setWind(level: number): void {
    const target = this.enabled() ? clamp(level, 0, 1) : 0;
    if (target === 0 && !this.wind) return;
    const ctx = this.ready(true);
    if (!ctx) return;
    if (!this.wind) {
      const source = ctx.createBufferSource();
      source.buffer = this.brownNoise(ctx);
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 0.3;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(this.master!);
      source.start();
      this.wind = { gain, filter, source };
    }
    const t = ctx.currentTime;
    this.wind.gain.gain.setTargetAtTime(0.07 * target * target, t, 0.4);
    this.wind.filter.frequency.setTargetAtTime(180 + 420 * target, t, 0.4);
  }

  stopWind(): void {
    if (!this.wind || !this.ctx) return;
    const { gain, source } = this.wind;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    source.stop(this.ctx.currentTime + 0.3);
    this.wind = null;
  }

  // ---------------------------------------------------------------------------

  private context(): AudioContext | null {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  // Contexto pronto para tocar, ou null se o som está desligado/bloqueado.
  private ready(ignoreMute = false): AudioContext | null {
    if (!ignoreMute && !this.enabled()) return null;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return null;
    return ctx;
  }

  private noiseSource(ctx: AudioContext, loop = false): AudioBufferSourceNode {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = loop;
    return src;
  }

  // Ruído marrom: integral do ruído branco — energia concentrada nos graves, som de vento distante.
  private brownNoise(ctx: AudioContext): AudioBuffer {
    if (!this.brown) {
      this.brown = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const data = this.brown.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.5;
      }
      // Emenda suave entre o fim e o começo do loop.
      const fade = Math.floor(ctx.sampleRate * 0.05);
      for (let i = 0; i < fade; i++) {
        const k = i / fade;
        data[i] *= k;
        data[data.length - 1 - i] *= k;
      }
    }
    return this.brown;
  }

  // Envelope ataque/decaimento: liga `node` (ou `tail`, se houver filtro no meio) ao master.
  private envelope(
    node: AudioScheduledSourceNode,
    t: number,
    peak: number,
    decay: number,
    tail: AudioNode = node,
    attack = 0.005,
  ): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    tail.connect(gain).connect(this.master!);
    node.start(t);
    node.stop(t + attack + decay + 0.05);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}
