import type {
  InclinedPlaneRequest,
  InclinedPlaneResponse,
  InclinedPlaneState,
} from "@ado-ii/shared";
import { DEFAULT_GRAVITY, DEFAULT_SAMPLES } from "@ado-ii/shared";
import { PhysicalSystem } from "./PhysicalSystem.js";
import { degToRad, linspace } from "./time.js";

export const TRACK_LENGTH = 4;
const MAX_DURATION = 5;

export class InclinedPlaneSystem extends PhysicalSystem<
  InclinedPlaneRequest,
  InclinedPlaneResponse
> {

  // N = m1 g cos theta
  normalForce(m1: number, g: number, theta: number): number {
    return m1 * g * Math.cos(theta);
  }

  // F_motriz = m2 g − m1 g sin theta
  drivingForce(m1: number, m2: number, g: number, theta: number): number {
    return (m2 * g) - (m1 * g * Math.sin(theta));
  }

  //|F_motriz| <= us N
  isStatic(drivingForce: number, normalForce: number, muS: number): boolean {
    return Math.abs(drivingForce) <= normalForce * muS;
  }


  //parado -> atrito estático equilibra: f = |F_motriz|
  //em movimento -> atrito cinético: f = uk N
  frictionForce(
    state: InclinedPlaneState,
    drivingForce: number,
    normalForce: number,
    muK: number,
  ): number {
    if(state == 'static'){
      return Math.abs(drivingForce);
    }
    return muK * normalForce;
  }

  //parado:        a = 0
  //em movimento:  a = (F_motriz − uk N · sinal(F_motriz)) / (m1 + m2)
  acceleration(
    state: InclinedPlaneState,
    drivingForce: number,
    normalForce: number,
    muK: number,
    m1: number,
    m2: number,
  ): number {
    if(state == 'static'){
      return 0;
    };
    return ((drivingForce - (muK * normalForce * Math.sign(drivingForce))) / (m1 + m2))
  }

  //T = m2 (g − a)
  tension(m2: number, g: number, a: number): number {
    return m2 * (g - a);
  }

  //x(t) = x0 + v0 t + 1/2 a t²
  position(t: number, a: number, x0 = 0, v0 = 0): number {
    return x0 + (v0 * t) + 0.5 * a * (t ** 2);
  }

  //v(t) = v0 + a t
  velocity(t: number, a: number, v0 = 0): number {
    return v0 + a * t;
  }

  simulate(input: InclinedPlaneRequest): InclinedPlaneResponse {
    const { m1, m2, muK, muS } = input;
    const g = input.gravity ?? DEFAULT_GRAVITY;
    const samples = input.samples ?? DEFAULT_SAMPLES;
    const theta = degToRad(input.angleDeg);

    const normalForce = this.normalForce(m1, g, theta);
    const drivingForce = this.drivingForce(m1, m2, g, theta);
    const state: InclinedPlaneState = this.isStatic(drivingForce, normalForce, muS)
      ? "static"
      : "moving";
    const frictionForce = this.frictionForce(state, drivingForce, normalForce, muK);
    const acceleration = this.acceleration(state, drivingForce, normalForce, muK, m1, m2);
    const tension = this.tension(m2, g, acceleration);

    // Simula até o bloco percorrer o plano inteiro
    const duration =
      input.duration ?? this.timeToTravel(TRACK_LENGTH, acceleration);

    const points = linspace(0, duration, samples).map((t) => ({
      t,
      x: this.position(t, acceleration),
      v: this.velocity(t, acceleration),
    }));

    return {
      normalForce,
      drivingForce,
      frictionForce,
      acceleration,
      tension,
      state,
      points,
    };
  }


  private timeToTravel(length: number, a: number): number {
    if (Math.abs(a) < 1e-9) return MAX_DURATION;
    return Math.min(MAX_DURATION, Math.sqrt((2 * length) / Math.abs(a)));
  }
}
