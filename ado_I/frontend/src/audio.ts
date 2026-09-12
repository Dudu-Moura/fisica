let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

export function playLaunchSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime;

  const sweep = ctx.createOscillator();
  sweep.type = "sawtooth";
  sweep.frequency.setValueAtTime(110, now);
  sweep.frequency.exponentialRampToValueAtTime(760, now + 0.35);

  const sweepGain = ctx.createGain();
  sweepGain.gain.setValueAtTime(0.0001, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

  sweep.connect(sweepGain).connect(ctx.destination);
  sweep.start(now);
  sweep.stop(now + 0.42);

  const noiseDuration = 0.3;
  const buffer = ctx.createBuffer(
    1,
    Math.floor(ctx.sampleRate * noiseDuration),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.16, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);

  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(now);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
