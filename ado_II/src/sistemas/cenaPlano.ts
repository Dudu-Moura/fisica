import { DEFAULT_GRAVITY, type InclinedPlaneResponse } from "../../lib/types";
import { escala, interpolar, seta } from "../Cena";

const PLANO = 6;
const BLOCO = 0.7;
const POLIA = 0.22;
const CURSO = 2.2;
const FATOR = CURSO / 4;
const FIO0 = CURSO + 0.4;
const MAIOR_SETA = 1.6;

type Vec = { x: number; y: number };

export interface DadosPlano {
  r: InclinedPlaneResponse | null;
  angulo: number;
  m1: number;
  m2: number;
}

export function desenharPlano(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, { r, angulo, m1, m2 }: DadosPlano) {
  const th = (angulo * Math.PI) / 180;
  const u = { x: Math.cos(th), y: Math.sin(th) };
  const n = { x: -Math.sin(th), y: Math.cos(th) };
  const topo = { x: PLANO * u.x, y: PLANO * u.y };

  const x = (r ? interpolar(r.points, t).x : 0) * FATOR;

  const s = limitar(PLANO / 2 + x, BLOCO / 2 + 0.2, PLANO - BLOCO / 2 - POLIA - 0.3);
  const fio = limitar(FIO0 + x, 0.4, FIO0 + CURSO);

  const polia = { x: topo.x + n.x * (BLOCO / 2 - POLIA), y: topo.y + n.y * (BLOCO / 2 - POLIA) };
  const xPendurado = polia.x + POLIA;
  const fundo = polia.y - FIO0 - CURSO - BLOCO - 0.3;

  const v = escala(w, h, {
    xmin: -0.4,
    xmax: xPendurado + BLOCO + 0.6,
    ymin: Math.min(-0.6, fundo),
    ymax: Math.max(topo.y, polia.y) + POLIA + 0.9,
  });

  ctx.fillStyle = "#ddd";
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(v.x(0), v.y(0));
  ctx.lineTo(v.x(topo.x), v.y(topo.y));
  ctx.lineTo(v.x(topo.x), v.y(0));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(v.x(-0.4), v.y(0));
  ctx.lineTo(v.x(topo.x), v.y(0));
  ctx.lineTo(v.x(topo.x), v.y(fundo));
  ctx.stroke();

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(v.x(0), v.y(0), 1.1 * v.s, -th, 0);
  ctx.stroke();
  ctx.fillStyle = "#333";
  ctx.font = "14px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`θ = ${angulo.toFixed(0)}°`, v.x(1.25), v.y(0.15));

  const c1 = { x: s * u.x + n.x * (BLOCO / 2), y: s * u.y + n.y * (BLOCO / 2) };
  const b = BLOCO * v.s;
  ctx.save();
  ctx.translate(v.x(c1.x), v.y(c1.y));
  ctx.rotate(-th);
  bloco(ctx, -b / 2, -b / 2, b, "#6b8cba", "m₁");
  ctx.restore();

  const inicioFio = { x: c1.x + u.x * (BLOCO / 2), y: c1.y + u.y * (BLOCO / 2) };
  const tangente = { x: polia.x + n.x * POLIA, y: polia.y + n.y * POLIA };
  const c2 = { x: xPendurado, y: polia.y - fio - BLOCO / 2 };
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(v.x(inicioFio.x), v.y(inicioFio.y));
  ctx.lineTo(v.x(tangente.x), v.y(tangente.y));
  ctx.arc(v.x(polia.x), v.y(polia.y), POLIA * v.s, -(Math.PI / 2 + th), 0);
  ctx.lineTo(v.x(xPendurado), v.y(c2.y + BLOCO / 2));
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(v.x(polia.x), v.y(polia.y), POLIA * v.s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  bloco(ctx, v.x(c2.x - BLOCO / 2), v.y(c2.y + BLOCO / 2), b, "#c47a4a", "m₂");

  if (!r) return;

  const p1 = m1 * DEFAULT_GRAVITY;
  const p2 = m2 * DEFAULT_GRAVITY;
  const k = MAIOR_SETA / Math.max(p1, p2, r.normalForce, r.tension, r.frictionForce);
  const sentidoAtrito = -Math.sign(r.drivingForce);

  const forca = (o: Vec, d: Vec, valor: number, cor: string, rotulo: string) =>
    seta(ctx, v.x(o.x), v.y(o.y), v.x(o.x + d.x * valor * k), v.y(o.y + d.y * valor * k), cor, rotulo);

  forca(c1, { x: 0, y: -1 }, p1, "#222", "P₁");
  forca(c1, n, r.normalForce, "#2a8a4a", "N");
  forca(c1, u, r.tension, "#b07a0c", "T");
  forca(c1, { x: u.x * sentidoAtrito, y: u.y * sentidoAtrito }, r.frictionForce, "#c00", "fa");

  forca(c2, { x: 0, y: -1 }, p2, "#222", "P₂");
  forca(c2, { x: 0, y: 1 }, r.tension, "#b07a0c", "T");
}

function bloco(ctx: CanvasRenderingContext2D, x: number, y: number, lado: number, cor: string, rotulo: string) {
  ctx.fillStyle = cor;
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, lado, lado);
  ctx.strokeRect(x, y, lado, lado);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rotulo, x + lado / 2, y + lado / 2);
}

function limitar(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
