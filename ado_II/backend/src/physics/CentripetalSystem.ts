import type { CentripetalRequest, CentripetalResponse } from "@ado-ii/shared";
import { DEFAULT_GRAVITY, DEFAULT_SAMPLES } from "@ado-ii/shared";
import { PhysicalSystem } from "./PhysicalSystem.js";
import { linspace } from "./time.js";

export class CentripetalSystem extends PhysicalSystem<
  CentripetalRequest,
  CentripetalResponse
> {

  //omega = v / R
  angularVelocity(speed: number, radius: number): number {
    return speed / radius;
  }

  //T = 2PI / omega
  period(omega: number): number {
    return (2 * Math.PI) / omega;
  }

  //ac = v² / R
  centripetalAcceleration(speed: number, radius: number): number {
    return (speed ** 2) / radius;
  }

  //Fc = m v² / R
  centripetalForce(mass: number, speed: number, radius: number): number {
    return (mass * (speed ** 2)) / radius;
  }

  //x(t) = R cos(omegat), y(t) = R sin(omegat)
  position(t: number, radius: number, omega: number): { x: number; y: number } {
    const x = radius * Math.cos(omega * t);
    const y = radius * Math.sin(omega * t);
    return { x, y };
  }

  //N = us m g
  maxFriction(muS: number, mass: number, g: number): number {
    return muS * mass * g;
  }


  maxSpeed(muS: number, g: number, radius: number): number {
    return Math.sqrt(muS * g * radius);
  }

  simulate(input: CentripetalRequest): CentripetalResponse {
    const { mode, mass, radius, speed } = input;
    const g = input.gravity ?? DEFAULT_GRAVITY;
    const samples = input.samples ?? DEFAULT_SAMPLES;

    const angularVelocity = this.angularVelocity(speed, radius);
    const period = this.period(angularVelocity);
    const centripetalAcceleration = this.centripetalAcceleration(speed, radius);
    const centripetalForce = this.centripetalForce(mass, speed, radius);

    let maxSpeed: number | null = null;
    let maxFriction: number | null = null;
    let skidding = false;
    if (mode === "car") {
      const muS = input.muS ?? 0;
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
