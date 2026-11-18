import { useEffect, useRef, useState } from "react";

type Desenho = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

interface Props {
  duracao: number;
  desenhar: Desenho;
  pausaNoFim?: number;
}

export function Cena({ duracao, desenhar, pausaNoFim = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rodando, setRodando] = useState(true);
  const estado = useRef({ t: 0, duracao, desenhar, pausaNoFim, rodando });
  Object.assign(estado.current, { duracao, desenhar, pausaNoFim, rodando });

  useEffect(() => {
    let frame = 0;
    let anterior = 0;

    const loop = (agora: number) => {
      const e = estado.current;
      const dt = anterior ? Math.min((agora - anterior) / 1000, 0.1) : 0;
      anterior = agora;
      if (e.rodando) {
        e.t += dt;
        if (e.t > e.duracao + e.pausaNoFim) e.t = 0;
      }
      pintar(canvasRef.current!, e.desenhar, Math.min(e.t, e.duracao));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, []);

  function reiniciar() {
    estado.current.t = 0;
    setRodando(true);
  }

  return (
    <div className="cena">
      <canvas ref={canvasRef} />
      <div className="botoes-cena">
        <button onClick={() => setRodando(!rodando)}>{rodando ? "Pausar" : "Continuar"}</button>
        <button onClick={reiniciar}>Reiniciar</button>
      </div>
    </div>
  );
}

function pintar(canvas: HTMLCanvasElement, desenhar: Desenho, t: number) {
  const ctx = canvas.getContext("2d")!;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  desenhar(ctx, w, h, t);

  ctx.fillStyle = "#333";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`t = ${t.toFixed(2)} s`, 10, h - 10);
}

export function interpolar<P extends { t: number }>(pontos: P[], t: number): P {
  const n = pontos.length;
  const fim = pontos[n - 1].t;
  const f = Math.max(0, Math.min(1, t / fim)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(f));
  const k = f - i;
  const a = pontos[i] as Record<string, unknown>;
  const b = pontos[i + 1] as Record<string, unknown>;
  const out: Record<string, unknown> = { ...a };
  for (const chave of Object.keys(a)) {
    const va = a[chave];
    const vb = b[chave];
    if (typeof va === "number" && typeof vb === "number") out[chave] = va + (vb - va) * k;
  }
  return out as P;
}

export function escala(w: number, h: number, caixa: { xmin: number; xmax: number; ymin: number; ymax: number }, margem = 24) {
  const bw = caixa.xmax - caixa.xmin;
  const bh = caixa.ymax - caixa.ymin;
  const s = Math.min((w - 2 * margem) / bw, (h - 2 * margem) / bh);
  const ox = (w - bw * s) / 2;
  const oy = (h + bh * s) / 2;
  return {
    s,
    x: (x: number) => ox + (x - caixa.xmin) * s,
    y: (y: number) => oy - (y - caixa.ymin) * s,
  };
}

export function seta(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cor: string,
  rotulo?: string,
  lado = 0,
) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 2) return;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const ponta = Math.min(10, len * 0.4);

  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - ponta * 0.6 * Math.cos(ang), y1 - ponta * 0.6 * Math.sin(ang));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ponta * Math.cos(ang - 0.4), y1 - ponta * Math.sin(ang - 0.4));
  ctx.lineTo(x1 - ponta * Math.cos(ang + 0.4), y1 - ponta * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();

  if (rotulo) {
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rotulo, x1 + 14 * Math.cos(ang) - lado * Math.sin(ang), y1 + 14 * Math.sin(ang) + lado * Math.cos(ang));
  }
}
