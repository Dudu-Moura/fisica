import type {
  TrajectoryPoint,
  TrajectoryRequest,
  TrajectoryResponse,
} from "@ado-i/shared";
import { DEFAULT_SAMPLES } from "@ado-i/shared";

export function computeTrajectory(
  input: TrajectoryRequest,
): TrajectoryResponse {
  const {
    initialSpeed: v0,
    angleDeg,
    initialHeight: y0,
    gravity: g,
  } = input;
  const samples = Math.max(2, Math.floor(input.samples ?? DEFAULT_SAMPLES));

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

  if (a === 0) {
    if (v0y === 0) return 0;
    const t = -y0 / v0y;
    return t > 0 ? t : 0;
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return 0;
  }

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b + sqrtD) / (2 * a);
  const t2 = (-b - sqrtD) / (2 * a);

  const candidates = [t1, t2].filter((t) => t > 1e-12);
  if (candidates.length === 0) return 0;
  return Math.max(...candidates);
}

export function computeMaxHeight(y0: number, v0y: number, g: number): number {
  if (v0y <= 0 || g <= 0) {
    return y0;
  }
  return y0 + (v0y * v0y) / (2 * g);
}

function samplePoints(
  v0x: number,
  v0y: number,
  y0: number,
  g: number,
  flightTime: number,
  samples: number,
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const n = samples;

  for (let i = 0; i < n; i++) {
    const t = flightTime === 0 ? 0 : (flightTime * i) / (n - 1);
    const x = v0x * t;
    let y = y0 + v0y * t - 0.5 * g * t * t;
    if (i === n - 1 || y < 0) y = 0;
    points.push({ t, x, y });
  }

  return points;
}
