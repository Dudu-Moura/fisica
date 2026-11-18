import { z } from "zod";
import type { TrajectoryPoint, TrajectoryResponse } from "./types.js";

export const trajectorySchema = z.object({
  initialSpeed: z.number().positive(),
  angleDeg: z.number().min(0).max(90),
  initialHeight: z.number().min(0),
  gravity: z.number().positive().default(9.81),
  samples: z.number().int().min(2).max(1000).default(100),
});

export type TrajectoryInput = z.infer<typeof trajectorySchema>;

export function computeTrajectory(input: TrajectoryInput): TrajectoryResponse {
  const { initialSpeed: v0, angleDeg, initialHeight: y0, gravity: g, samples } = input;

  const theta = (angleDeg * Math.PI) / 180;
  const v0x = v0 * Math.cos(theta);
  const v0y = v0 * Math.sin(theta);

  const flightTime = solveFlightTime(y0, v0y, g);
  const maxHeight = computeMaxHeight(y0, v0y, g);
  const range = v0x * flightTime;
  const points = samplePoints(v0x, v0y, y0, g, flightTime, samples);

  return { flightTime, maxHeight, range, points };
}

export function solveFlightTime(y0: number, v0y: number, g: number): number {
  const a = g / 2;
  const b = -v0y;
  const c = -y0;

  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

export function computeMaxHeight(y0: number, v0y: number, g: number): number {
  if (v0y <= 0) return y0;
  return y0 + (v0y * v0y) / (2 * g);
}

function samplePoints(
  v0x: number,
  v0y: number,
  y0: number,
  g: number,
  flightTime: number,
  n: number,
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];

  for (let i = 0; i < n; i++) {
    const t = (flightTime * i) / (n - 1);
    const x = v0x * t;
    let y = y0 + v0y * t - 0.5 * g * t * t;
    if (i === n - 1) y = 0;
    points.push({ t, x, y });
  }

  return points;
}
