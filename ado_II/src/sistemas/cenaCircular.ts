import type { CentripetalMode, CentripetalResponse } from "../../lib/types";
import { escala, interpolar, seta } from "../Cena";

const MEIA_PISTA = 0.12;
const SAIDA = 1.3;

export interface DadosCircular {
  r: CentripetalResponse | null;
  modo: CentripetalMode;
  raio: number;
  velocidade: number;
}

function derrapando({ r }: DadosCircular) {
  return !!r?.skidding;
}

function raioDerrapagem({ r, raio, velocidade }: DadosCircular) {
  return raio * (velocidade / r!.maxSpeed!) ** 2;
}

function tempoDerrapagem({ raio, velocidade }: DadosCircular, rd: number) {
  const d = raio - rd;
  const cos = ((SAIDA * raio) ** 2 - d * d - rd * rd) / (2 * d * rd);
  const phi = Math.abs(cos) <= 1 ? Math.acos(cos) : Math.PI;
  return (phi * rd) / velocidade;
}

export function duracaoCircular(dados: DadosCircular) {
  if (!dados.r) return 0;
  if (derrapando(dados)) return tempoDerrapagem(dados, raioDerrapagem(dados)) + 0.6;
  return dados.r.period;
}

export function desenharCircular(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dados: DadosCircular) {
  const { r, raio: R, velocidade } = dados;
  const carro = dados.modo === "car";
  const v = escala(w, h, { xmin: -1.35 * R, xmax: 1.35 * R, ymin: -1.35 * R, ymax: 1.35 * R });
  const cx = v.x(0);
  const cy = v.y(0);
  const rPx = R * v.s;

  if (carro) {
    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 2 * MEIA_PISTA * rPx;
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  if (!r) return;

  let pos = interpolar(r.points, t);
  let direcao = Math.atan2(pos.y, pos.x) + Math.PI / 2;
  let saiu = false;

  if (derrapando(dados)) {
    const rd = raioDerrapagem(dados);
    const phi = (velocidade * t) / rd;
    pos = { t, x: R - rd + rd * Math.cos(phi), y: rd * Math.sin(phi) };
    direcao = phi + Math.PI / 2;
    saiu = Math.hypot(pos.x, pos.y) > R * (1 + MEIA_PISTA);

    ctx.strokeStyle = "#c00";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(v.x(R - rd), cy, rd * v.s, 0, -Math.PI, true);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const px = v.x(pos.x);
  const py = v.y(pos.y);

  if (!carro) {
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
  }

  const tam = Math.min(0.55 * rPx, 90);
  seta(ctx, px, py, px + tam * Math.cos(direcao), py - tam * Math.sin(direcao), "#2255aa", "v");
  if (!saiu) {
    const centro = Math.atan2(-pos.y, -pos.x);
    seta(ctx, px, py, px + tam * Math.cos(centro), py - tam * Math.sin(centro), "#c47a00", carro ? "fa = Fc" : "T = Fc", -30);
  }

  if (carro) {
    const c = Math.max(16, Math.min(0.17 * rPx, 38));
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-direcao);
    ctx.fillStyle = r.skidding ? "#c33" : "#6b8cba";
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.fillRect(-c / 2, -c / 4, c, c / 2);
    ctx.strokeRect(-c / 2, -c / 4, c, c / 2);
    ctx.fillStyle = "#ddd";
    ctx.fillRect(c / 8, -c / 6, c / 5, c / 3);
    ctx.restore();
  } else {
    ctx.fillStyle = "#6b8cba";
    ctx.strokeStyle = "#222";
    ctx.beginPath();
    ctx.arc(px, py, Math.max(8, Math.min(0.07 * rPx, 16)), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (r.skidding && carro) {
    ctx.fillStyle = "#c00";
    ctx.font = "bold 15px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Derrapando: v > v máx", 10, 10);
  }
}
