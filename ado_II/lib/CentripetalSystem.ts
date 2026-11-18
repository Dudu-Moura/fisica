import type { CentripetalInput } from "./schemas.js";
import type { CentripetalResponse } from "./types.js";
import { linspace } from "./time.js";

export class CentripetalSystem {
  angularVelocity(speed: number, radius: number): number {
    return speed / radius;
  }

  period(omega: number): number {
    return (2 * Math.PI) / omega;
  }

  centripetalAcceleration(speed: number, radius: number): number {
    return (speed ** 2) / radius;
  }

  centripetalForce(mass: number, speed: number, radius: number): number {
    return (mass * (speed ** 2)) / radius;
  }

  position(t: number, radius: number, omega: number): { x: number; y: number } {
    const x = radius * Math.cos(omega * t);
    const y = radius * Math.sin(omega * t);
    return { x, y };
  }

  maxFriction(muS: number, mass: number, g: number): number {
    return muS * mass * g;
  }

  maxSpeed(muS: number, g: number, radius: number): number {
    return Math.sqrt(muS * g * radius);
  }

  simulate(input: CentripetalInput): CentripetalResponse {
    const { mode, mass, radius, speed, muS, gravity: g, samples } = input;

    const angularVelocity = this.angularVelocity(speed, radius);
    const period = this.period(angularVelocity);
    const centripetalAcceleration = this.centripetalAcceleration(speed, radius);
    const centripetalForce = this.centripetalForce(mass, speed, radius);

    let maxSpeed: number | null = null;
    let maxFriction: number | null = null;
    let skidding = false;
    if (mode === "car") {
      maxSpeed = this.maxSpeed(muS, g, radius);
      maxFriction = this.maxFriction(muS, mass, g);
      skidding = speed > maxSpeed;
    }

    const points = linspace(0, period, samples).map((t) => ({
      t,
      ...this.position(t, radius, angularVelocity),
    }));

    return {
      angularVelocity,
      period,
      centripetalForce,
      centripetalAcceleration,
      maxSpeed,
      maxFriction,
      skidding,
      points,
    };
  }
}
