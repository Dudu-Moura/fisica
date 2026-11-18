import type { DragInput } from "./schemas.js";
import type { DragResponse } from "./types.js";
import { linspace } from "./time.js";

const DURATION_FACTOR = 2;
const MIN_DURATION = 1;
const MAX_DURATION = 120;

export class DragSystem {
  linearTerminalVelocity(mass: number, g: number, b: number): number {
    return (mass * g) / b;
  }

  linearTimeConstant(mass: number, b: number): number {
    return mass / b;
  }

  linearVelocity(t: number, vt: number, tau: number): number {
    return vt * (1 - Math.E ** (-t/tau));
  }

  linearPosition(t: number, vt: number, tau: number): number {
    return vt * t - vt * tau * (1 - Math.E ** (-t / tau));
  }

  linearTimeTo95(tau: number): number {
    return tau * (Math.LN2 + Math.LN10);
  }

  quadraticTerminalVelocity(mass: number, g: number, c: number): number {
    return Math.sqrt(mass * g / c);
  }

  quadraticVelocity(t: number, vt: number, g: number): number {
    return vt * Math.tanh(g * t / vt);
  }

  quadraticPosition(t: number, vt: number, g: number): number {
    return ((vt ** 2) / g) * Math.log(Math.cosh(g * t / vt));
  }

  quadraticTimeTo95(vt: number, g: number): number {
    return (vt / g) * Math.atanh(0.95);
  }

  freeFallVelocity(t: number, g: number): number {
    return g * t;
  }

  freeFallPosition(t: number, g: number): number {
    return 0.5 * g * (t ** 2);
  }

  simulate(input: DragInput): DragResponse {
    const { model, mass, coefficient, gravity: g, samples } = input;

    let terminalVelocity: number;
    let timeConstant: number | null = null;
    let timeTo95: number;
    let velocityAt: (t: number) => number;
    let positionAt: (t: number) => number;

    if (model === "linear") {
      const tau = this.linearTimeConstant(mass, coefficient);
      terminalVelocity = this.linearTerminalVelocity(mass, g, coefficient);
      timeConstant = tau;
      timeTo95 = this.linearTimeTo95(tau);
      velocityAt = (t) => this.linearVelocity(t, terminalVelocity, tau);
      positionAt = (t) => this.linearPosition(t, terminalVelocity, tau);
    } else {
      terminalVelocity = this.quadraticTerminalVelocity(mass, g, coefficient);
      timeTo95 = this.quadraticTimeTo95(terminalVelocity, g);
      velocityAt = (t) => this.quadraticVelocity(t, terminalVelocity, g);
      positionAt = (t) => this.quadraticPosition(t, terminalVelocity, g);
    }

    const duration =
      input.duration ??
      Math.min(MAX_DURATION, Math.max(MIN_DURATION, DURATION_FACTOR * timeTo95));

    const points = linspace(0, duration, samples).map((t) => ({
      t,
      v: velocityAt(t),
      y: positionAt(t),
      vFree: this.freeFallVelocity(t, g),
      yFree: this.freeFallPosition(t, g),
    }));

    return { terminalVelocity, timeConstant, timeTo95, points };
  }
}
