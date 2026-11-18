import { useEffect, useRef } from "react";
import type { TrajectoryResponse } from "../lib/types";

interface Props {
  trajetoria: TrajectoryResponse | null;
  indice: number;
}

const M = { top: 15, right: 20, bottom: 40, left: 50 };

function passoGrade(intervalo: number): number {
  const pot = 10 ** Math.floor(Math.log10(intervalo));
  const n = intervalo / pot;
  if (n < 1.5) return pot;
  if (n < 3.5) return 2 * pot;
  if (n < 7.5) return 5 * pot;
  return 10 * pot;
}

export function Grafico({ trajetoria, indice }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const desenhar = () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      desenharGrafico(ctx, w, h, trajetoria, indice);
    };

    desenhar();
    window.addEventListener("resize", desenhar);
    return () => window.removeEventListener("resize", desenhar);
  }, [trajetoria, indice]);

  return <canvas ref={ref} className="grafico" />;
}

function desenharGrafico(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  traj: TrajectoryResponse | null,
  idx: number,
) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  const plotW = w - M.left - M.right;
  const plotH = h - M.top - M.bottom;

  const alcance = Math.max(traj?.range ?? 10, 1);
  const alturaMax = Math.max(traj?.maxHeight ?? 5, 1);

  const escala = Math.min(plotW / (alcance * 1.1), plotH / (alturaMax * 1.15));
  const xMax = plotW / escala;
  const yMax = plotH / escala;
  const passo = passoGrade(xMax / 10);

  const px = (x: number) => M.left + x * escala;
  const py = (y: number) => M.top + plotH - y * escala;

  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#333";
  ctx.font = "12px Arial, sans-serif";
  ctx.textAlign = "center";
  for (let x = 0; x <= xMax; x += passo) {
    ctx.beginPath();
    ctx.moveTo(px(x), M.top);
    ctx.lineTo(px(x), py(0));
    ctx.stroke();
    ctx.fillText(String(Number(x.toFixed(2))), px(x), py(0) + 16);
  }
  ctx.textAlign = "right";
  for (let y = 0; y <= yMax; y += passo) {
    ctx.beginPath();
    ctx.moveTo(M.left, py(y));
    ctx.lineTo(M.left + plotW, py(y));
    ctx.stroke();
    if (y > 0) ctx.fillText(String(Number(y.toFixed(2))), M.left - 6, py(y) + 4);
  }

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(M.left, M.top);
  ctx.lineTo(M.left, py(0));
  ctx.lineTo(M.left + plotW, py(0));
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText("x (m)", M.left + plotW / 2, h - 6);
  ctx.save();
  ctx.translate(14, M.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("y (m)", 0, 0);
  ctx.restore();

  if (!traj || traj.points.length < 2) return;
  const pts = traj.points;

  const topo = pts.reduce((a, b) => (b.y > a.y ? b : a));
  ctx.strokeStyle = "#999";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(M.left, py(topo.y));
  ctx.lineTo(px(topo.x), py(topo.y));
  ctx.lineTo(px(topo.x), py(0));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#555";
  ctx.textAlign = "left";
  ctx.fillText(`ymax = ${traj.maxHeight.toFixed(2)} m`, px(topo.x) + 6, py(topo.y) - 6);
  ctx.fillText(`R = ${traj.range.toFixed(2)} m`, px(traj.range) + 8, py(0) - 8);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(px(p.x), py(p.y));
    else ctx.lineTo(px(p.x), py(p.y));
  });
  ctx.stroke();

  const p = pts[Math.min(idx, pts.length - 1)];
  ctx.fillStyle = "#c00";
  ctx.beginPath();
  ctx.arc(px(p.x), py(p.y), 6, 0, Math.PI * 2);
  ctx.fill();
}
