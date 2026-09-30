export const DEFAULT_GRAVITY = 9.81;
export const DEFAULT_SAMPLES = 200;

export type SystemId = "inclined-plane" | "centripetal" | "drag";

export interface ApiError {
  error: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Plano inclinado com atrito e tração
// ---------------------------------------------------------------------------

export interface InclinedPlaneRequest {
  m1: number; // massa do bloco no plano (kg)
  m2: number; // massa pendurada (kg)
  angleDeg: number; // inclinação θ (graus)
  muK: number; // coeficiente de atrito cinético
  muS: number; // coeficiente de atrito estático
  gravity?: number;
  duration?: number; // janela de tempo simulada (s)
  samples?: number;
}

export type InclinedPlaneState = "moving" | "static";

// x > 0 / v > 0 significa: m1 SOBE o plano (m2 desce).
export interface MotionPoint {
  t: number;
  x: number;
  v: number;
}

export interface InclinedPlaneResponse {
  normalForce: number; // N = m1 g cos θ
  drivingForce: number; // F_motriz = m2 g − m1 g sin θ
  frictionForce: number; // atrito efetivo (estático ou cinético), em módulo
  acceleration: number; // a (constante)
  tension: number; // T = m2 (g − a)
  state: InclinedPlaneState;
  points: MotionPoint[];
}

// ---------------------------------------------------------------------------
// Força centrípeta
// ---------------------------------------------------------------------------

// "string": massa presa a um fio (MCU)
// "car":    carro numa curva plana, atrito estático fornece a força centrípeta
export type CentripetalMode = "string" | "car";

export interface CentripetalRequest {
  mode: CentripetalMode;
  mass: number; // kg
  radius: number; // m
  speed: number; // velocidade tangencial (m/s)
  muS?: number; // atrito estático pneu-pista (apenas no modo "car")
  gravity?: number;
  samples?: number;
}

export interface CircularPoint {
  t: number;
  x: number;
  y: number;
}

export interface CentripetalResponse {
  angularVelocity: number; // ω = v / R
  period: number; // T = 2π / ω
  centripetalForce: number; // Fc = m v² / R
  centripetalAcceleration: number; // ac = v² / R
  maxSpeed: number | null; // v_max = √(μ g R)  (modo "car")
  maxFriction: number | null; // μ m g (modo "car")
  skidding: boolean; // true se v > v_max (modo "car")
  points: CircularPoint[]; // uma volta completa
}

// ---------------------------------------------------------------------------
// Força de arrasto
// ---------------------------------------------------------------------------

export type DragModel = "linear" | "quadratic";

export interface DragRequest {
  model: DragModel;
  mass: number; // kg
  coefficient: number; // b (kg/s) no linear, c (kg/m) no quadrático
  gravity?: number;
  duration?: number; // s
  samples?: number;
}

// y = distância percorrida para baixo (positiva)
export interface FallPoint {
  t: number;
  v: number; // com arrasto
  y: number; // com arrasto
  vFree: number; // queda livre, v = g t
  yFree: number; // queda livre, y = g t² / 2
}

export interface DragResponse {
  terminalVelocity: number;
  timeConstant: number | null; // τ = m / b (apenas linear)
  timeTo95: number; // tempo para atingir 95% de v_terminal
  points: FallPoint[];
}
