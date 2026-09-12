import { useEffect, useRef } from "react";
import type { TrajectoryResponse } from "@ado-i/shared";
import type { PlanetTheme } from "../planets";

interface Props {
  trajectory: TrajectoryResponse | null;
  projectileIndex: number;
  animating: boolean;
  theme: PlanetTheme;
}

const PAD = { top: 28, right: 28, bottom: 44, left: 52 };

// Posições fixas (fração de 0 a 1) para o céu estrelado da Lua não "pular" a cada resize.
const STAR_FIELD = Array.from({ length: 40 }, (_, i) => {
  const seed = i * 137.51;
  return {
    x: (seed % 100) / 100,
    y: ((seed * 3.17) % 100) / 100,
    r: 0.6 + ((seed * 7.13) % 100) / 100,
  };
});

export function TrajectoryCanvas({
  trajectory,
  projectileIndex,
  animating,
  theme,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    drawScene(ctx, w, h, trajectory, projectileIndex, animating, theme);
  }, [trajectory, projectileIndex, animating, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(
        ctx,
        rect.width,
        rect.height,
        trajectory,
        projectileIndex,
        animating,
        theme,
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [trajectory, projectileIndex, animating, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="trajectory-canvas"
      role="img"
      aria-label="Gráfico da trajetória do projétil"
    />
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  trajectory: TrajectoryResponse | null,
  projectileIndex: number,
  animating: boolean,
  theme: PlanetTheme,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme.skyStops[0]);
  sky.addColorStop(0.55, theme.skyStops[1]);
  sky.addColorStop(1, theme.skyStops[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (theme.stars) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    for (const star of STAR_FIELD) {
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h * 0.75, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const plotW = w - PAD.left - PAD.right;
  const plotH = h - PAD.top - PAD.bottom;

  const maxX = Math.max(trajectory?.range ?? 10, 1);
  const maxY = Math.max(trajectory?.maxHeight ?? 5, 1);
  const worldW = maxX * 1.08;
  const worldH = maxY * 1.18;

  // Uma escala única (m/px) para os dois eixos: se x e y usassem escalas
  // independentes, a parábola apareceria achatada ou esticada dependendo
  // da proporção entre alcance e altura máxima.
  const scale = Math.min(plotW / worldW, plotH / worldH);
  const usedW = worldW * scale;
  const usedH = worldH * scale;

  const toScreen = (x: number, y: number) => ({
    sx: PAD.left + x * scale,
    sy: PAD.top + usedH - y * scale,
  });

  const groundY = toScreen(0, 0).sy;
  ctx.fillStyle = theme.groundBase;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = theme.groundEdge;
  ctx.fillRect(0, groundY, w, 3);

  ctx.strokeStyle = "rgba(30, 50, 40, 0.12)";
  ctx.lineWidth = 1;
  const xTicks = 5;
  const yTicks = 4;
  for (let i = 0; i <= xTicks; i++) {
    const x = (worldW * i) / xTicks;
    const { sx } = toScreen(x, 0);
    ctx.beginPath();
    ctx.moveTo(sx, PAD.top);
    ctx.lineTo(sx, groundY);
    ctx.stroke();
  }
  for (let i = 0; i <= yTicks; i++) {
    const y = (worldH * i) / yTicks;
    const { sy } = toScreen(0, y);
    ctx.beginPath();
    ctx.moveTo(PAD.left, sy);
    ctx.lineTo(PAD.left + plotW, sy);
    ctx.stroke();
  }

  ctx.strokeStyle = "#1e3228";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, groundY);
  ctx.lineTo(PAD.left + usedW, groundY);
  ctx.stroke();

  ctx.fillStyle = "#1e3228";
  ctx.font = "12px DM Sans, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i <= xTicks; i++) {
    const x = (worldW * i) / xTicks;
    const { sx } = toScreen(x, 0);
    ctx.fillText(`${x.toFixed(0)} m`, sx, groundY + 18);
  }
  ctx.textAlign = "right";
  for (let i = 0; i <= yTicks; i++) {
    const y = (worldH * i) / yTicks;
    const { sy } = toScreen(0, y);
    ctx.fillText(`${y.toFixed(0)}`, PAD.left - 8, sy + 4);
  }
  ctx.save();
  ctx.translate(16, PAD.top + usedH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("altura (m)", 0, 0);
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillText("alcance (m)", PAD.left + usedW / 2, h - 10);

  if (!trajectory || trajectory.points.length < 2) {
    ctx.fillStyle = "rgba(30, 50, 40, 0.55)";
    ctx.font = "500 15px DM Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Aguardando trajetória…", w / 2, h / 2);
    return;
  }

  const points = trajectory.points;

  ctx.beginPath();
  points.forEach((p, i) => {
    const { sx, sy } = toScreen(p.x, p.y);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.lineTo(toScreen(points[points.length - 1].x, 0).sx, groundY);
  ctx.lineTo(toScreen(points[0].x, 0).sx, groundY);
  ctx.closePath();
  ctx.fillStyle = withAlpha(theme.accent, 0.1);
  ctx.fill();

  let apex = points[0];
  for (const p of points) {
    if (p.y > apex.y) apex = p;
  }
  const apexScreen = toScreen(apex.x, apex.y);
  ctx.fillStyle = "#1e3228";
  ctx.beginPath();
  ctx.arc(apexScreen.sx, apexScreen.sy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "11px DM Sans, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("H máx", apexScreen.sx + 8, apexScreen.sy - 6);

  const launch = toScreen(points[0].x, points[0].y);
  ctx.fillStyle = "#2a5a8a";
  ctx.beginPath();
  ctx.arc(launch.sx, launch.sy, 5, 0, Math.PI * 2);
  ctx.fill();

  const idx = Math.min(Math.max(projectileIndex, 0), points.length - 1);
  const proj = points[idx];
  const { sx, sy } = toScreen(proj.x, proj.y);

  ctx.beginPath();
  ctx.arc(sx, sy, animating ? 7 : 5.5, 0, Math.PI * 2);
  ctx.fillStyle = "#e8a317";
  ctx.fill();
  ctx.strokeStyle = "#8a5a00";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (animating) {
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(232, 163, 23, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
