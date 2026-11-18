import type { InclinedPlaneInput } from "./schemas.js";
import type { InclinedPlaneResponse, InclinedPlaneState } from "./types.js";
import { degToRad, linspace } from "./time.js";

export const TRACK_LENGTH = 4;
const MAX_DURATION = 5;

export class InclinedPlaneSystem {
  normalForce(m1: number, g: number, theta: number): number {
    return m1 * g * Math.cos(theta);
  }

  drivingForce(m1: number, m2: number, g: number, theta: number): number {
    return (m2 * g) - (m1 * g * Math.sin(theta));
  }

  isStatic(drivingForce: number, normalForce: number, muS: number): boolean {
    return Math.abs(drivingForce) <= normalForce * muS;
  }

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

  tension(m2: number, g: number, a: number): number {
    return m2 * (g - a);
  }

  position(t: number, a: number, x0 = 0, v0 = 0): number {
    return x0 + (v0 * t) + 0.5 * a * (t ** 2);
  }

  velocity(t: number, a: number, v0 = 0): number {
    return v0 + a * t;
  }

  simulate(input: InclinedPlaneInput): InclinedPlaneResponse {
    const { m1, m2, muK, muS, gravity: g, samples } = input;
    const theta = degToRad(input.angleDeg);

    const normalForce = this.normalForce(m1, g, theta);
    const drivingForce = this.drivingForce(m1, m2, g, theta);
    const state: InclinedPlaneState = this.isStatic(drivingForce, normalForce, muS)
      ? "static"
      : "moving";
    const frictionForce = this.frictionForce(state, drivingForce, normalForce, muK);
    const acceleration = this.acceleration(state, drivingForce, normalForce, muK, m1, m2);
    const tension = this.tension(m2, g, acceleration);

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
    return Math.min(MAX_DURATION, Math.sqrt((2 * length) / Math.abs(a)));
  }
}
