import type { DragRequest, DragResponse } from "@ado-ii/shared";
import { DEFAULT_GRAVITY, DEFAULT_SAMPLES } from "@ado-ii/shared";
import { PhysicalSystem } from "./PhysicalSystem.js";
import { linspace } from "./time.js";


const DURATION_FACTOR = 2;
const MIN_DURATION = 1;
const MAX_DURATION = 120;

export class DragSystem extends PhysicalSystem<DragRequest, DragResponse> {

  //v_t = m g / b
  linearTerminalVelocity(mass: number, g: number, b: number): number {
    return (mass * g) / b;
  }

  //τ = m / b
  linearTimeConstant(mass: number, b: number): number {
    return mass / b;
  }

  //v(t) = v_t (1 − e^(−t/τ))
  linearVelocity(t: number, vt: number, tau: number): number {
    return vt * (1 - Math.E ** (-t/tau));
  }

  //y(t) = v_t t − v_t τ (1 − e^(−t/τ))
  linearPosition(t: number, vt: number, tau: number): number {
    return vt * t - vt * tau * (1 - Math.E ** (-t / tau));
  }

  //t95 = τ ln(20)
  linearTimeTo95(tau: number): number {
    return tau * (Math.LN2 + Math.LN10);
  }



  //v_t = √(m g / c)
  quadraticTerminalVelocity(mass: number, g: number, c: number): number {
    return Math.sqrt(mass * g / c);
  }

  //v(t) = v_t tanh(g t / v_t)
  quadraticVelocity(t: number, vt: number, g: number): number {
    return vt * Math.tanh(g * t / vt);
  }

  //y(t) = (v_t² / g) ln(cosh(g t / v_t))
  quadraticPosition(t: number, vt: number, g: number): number {
    return ((vt ** 2) / g) * Math.log(Math.cosh(g * t / vt));
  }

  //t95 = (v_t / g) atanh(0,95)
  quadraticTimeTo95(vt: number, g: number): number {
    return (vt / g) * Math.atanh(0.95);
  }


  //v(t) = g t
  freeFallVelocity(t: number, g: number): number {
    return g * t;
  }

  //y(t) = ½ g t²
  freeFallPosition(t: number, g: number): number {
    return 0.5 * g * (t ** 2);
  }

  simulate(input: DragRequest): DragResponse {
    const { model, mass, coefficient } = input;
    const g = input.gravity ?? DEFAULT_GRAVITY;
    const samples = input.samples ?? DEFAULT_SAMPLES;

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
