export interface TrajectoryRequest {
  initialSpeed: number;
  angleDeg: number;
  initialHeight: number;
  gravity: number;
  samples?: number;
}

export interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
}

export interface TrajectoryResponse {
  flightTime: number;
  maxHeight: number;
  range: number;
  points: TrajectoryPoint[];
}

export const DEFAULT_GRAVITY = 9.81;
export const DEFAULT_SAMPLES = 100;
