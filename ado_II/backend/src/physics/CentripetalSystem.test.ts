import { describe, expect, it } from "vitest";
import { CentripetalSystem } from "./CentripetalSystem.js";

const system = new CentripetalSystem();

describe("CentripetalSystem", () => {
  it("calcula ω, período e Fc no MCU", () => {
    const r = system.simulate({ mode: "string", mass: 2, radius: 1.5, speed: 3 });
    expect(r.angularVelocity).toBeCloseTo(2, 6);
    expect(r.period).toBeCloseTo(Math.PI, 6);
    expect(r.centripetalAcceleration).toBeCloseTo(6, 6);
    expect(r.centripetalForce).toBeCloseTo(12, 6);
    expect(r.maxSpeed).toBeNull();
  });

  it("a trajetória é um círculo de raio R", () => {
    const r = system.simulate({ mode: "string", mass: 1, radius: 2, speed: 5 });
    for (const p of r.points) expect(Math.hypot(p.x, p.y)).toBeCloseTo(2, 6);
    expect(r.points[0].x).toBeCloseTo(2, 6);
    expect(r.points[0].y).toBeCloseTo(0, 6);
  });

  it("modo carro: v_max = √(μ g R) e detecta derrapagem", () => {
    const ok = system.simulate({ mode: "car", mass: 1000, radius: 50, speed: 15, muS: 0.8, gravity: 9.8 });
    expect(ok.maxSpeed).toBeCloseTo(Math.sqrt(0.8 * 9.8 * 50), 6);
    expect(ok.maxFriction).toBeCloseTo(0.8 * 1000 * 9.8, 6);
    expect(ok.skidding).toBe(false);

    const skid = system.simulate({ mode: "car", mass: 1000, radius: 50, speed: 25, muS: 0.8, gravity: 9.8 });
    expect(skid.skidding).toBe(true);
  });
});
