import type { DragResponse } from "../../lib/types";
import { interpolar } from "../Cena";
import { fmt } from "../format";

export interface Queda {
  altura: number;
  chegadaLivre: number;
  fim: number;
}

export function calcularQueda(r: DragResponse | null): Queda | null {
  if (!r) return null;
  const pts = r.points;
  const altura = pts[pts.length - 1].y;
  let chegadaLivre = pts[pts.length - 1].t;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].yFree >= altura) {
      const a = pts[i - 1];
      const b = pts[i];
      chegadaLivre = a.t + ((altura - a.yFree) / (b.yFree - a.yFree)) * (b.t - a.t);
      break;
    }
  }
  return { altura, chegadaLivre, fim: pts[pts.length - 1].t };
}

export function desenharQueda(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  r: DragResponse | null,
  q: Queda | null,
) {
  const topo = 52;
  const chao = h - 40;
  const colunas = [w * 0.38, w * 0.72];

  ctx.fillStyle = "#222";
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("com arrasto", colunas[0], 26);
  ctx.fillText("sem arrasto (vácuo)", colunas[1], 26);

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  for (const x of colunas) {
    ctx.beginPath();
    ctx.moveTo(x, topo);
    ctx.lineTo(x, chao);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(56, chao);
  ctx.lineTo(w - 16, chao);
  ctx.stroke();
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  for (let x = 60; x < w - 16; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, chao + 1);
    ctx.lineTo(x - 7, chao + 8);
    ctx.stroke();
  }

  if (!r || !q) return;

  const p = interpolar(r.points, t);
  const py = (y: number) => topo + (Math.min(y, q.altura) / q.altura) * (chao - topo);

  ctx.fillStyle = "#333";
  ctx.strokeStyle = "#333";
  ctx.font = "11px monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = (q.altura * i) / 4;
    ctx.beginPath();
    ctx.moveTo(44, py(y));
    ctx.lineTo(52, py(y));
    ctx.stroke();
    ctx.fillText(fmt(q.altura - y, q.altura < 10 ? 1 : 0), 42, py(y) + 4);
  }
  ctx.textAlign = "left";
  ctx.fillText("h (m)", 8, topo - 14);

  const chegouLivre = t >= q.chegadaLivre;
  const chegouArrasto = t >= q.fim;
  corpo(ctx, colunas[0], py(p.y), chegouArrasto ? null : p.v, r.terminalVelocity);
  corpo(ctx, colunas[1], py(p.yFree), chegouLivre ? null : p.vFree, null);

  ctx.fillStyle = "#333";
  ctx.font = "12px Arial, sans-serif";
  ctx.textAlign = "center";
  if (chegouArrasto) ctx.fillText(`chegou em ${fmt(q.fim)} s`, colunas[0], chao + 24);
  if (chegouLivre) ctx.fillText(`chegou em ${fmt(q.chegadaLivre)} s`, colunas[1], chao + 24);
}

function corpo(ctx: CanvasRenderingContext2D, x: number, y: number, v: number | null, vt: number | null) {
  const raio = 12;
  const cy = v === null ? y - raio : y;

  ctx.fillStyle = "#6b8cba";
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, cy, raio, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#222";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if (v === null) {
    ctx.fillText("no chão", x + 20, cy);
  } else {
    ctx.fillText(`${fmt(v, 1)} m/s`, x + 20, cy);
    if (vt) ctx.fillText(`${fmt((100 * v) / vt, 0)}% de vt`, x + 20, cy + 16);
  }
  ctx.textBaseline = "alphabetic";
}
