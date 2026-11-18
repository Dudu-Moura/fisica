export const DEFAULT_GRAVITY = 9.81;

export type SystemId = "inclined-plane" | "centripetal" | "drag";

export interface InclinedPlaneRequest {
  m1: number;
  m2: number;
  angleDeg: number;
  muK: number;
  muS: number;
  gravity?: number;
  duration?: number;
  samples?: number;
}

export type InclinedPlaneState = "moving" | "static";

export interface MotionPoint {
  t: number;
  x: number;
  v: number;
}

export interface InclinedPlaneResponse {
  normalForce: number;
  drivingForce: number;
  frictionForce: number;
  acceleration: number;
  tension: number;
  state: InclinedPlaneState;
  points: MotionPoint[];
}

export type CentripetalMode = "string" | "car";

export interface CentripetalRequest {
  mode: CentripetalMode;
  mass: number;
  radius: number;
  speed: number;
  muS?: number;
  gravity?: number;
  samples?: number;
}

export interface CircularPoint {
  t: number;
  x: number;
  y: number;
}

export interface CentripetalResponse {
  angularVelocity: number;
  period: number;
  centripetalForce: number;
  centripetalAcceleration: number;
  maxSpeed: number | null;
  maxFriction: number | null;
  skidding: boolean;
  points: CircularPoint[];
}

export type DragModel = "linear" | "quadratic";

export interface DragRequest {
  model: DragModel;
  mass: number;
  coefficient: number;
  gravity?: number;
  duration?: number;
  samples?: number;
}

export interface FallPoint {
  t: number;
  v: number;
  y: number;
  vFree: number;
  yFree: number;
}

export interface DragResponse {
  terminalVelocity: number;
  timeConstant: number | null;
  timeTo95: number;
  points: FallPoint[];
}
