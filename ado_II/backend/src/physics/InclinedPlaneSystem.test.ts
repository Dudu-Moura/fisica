import { describe, expect, it } from "vitest";
import { InclinedPlaneSystem } from "./InclinedPlaneSystem.js";

const system = new InclinedPlaneSystem();
const base = { m1: 5, m2: 3, angleDeg: 30, muK: 0.2, muS: 0.2, gravity: 9.8 };

describe("InclinedPlaneSystem", () => {
  it("calcula N e F_motriz", () => {
    const r = system.simulate(base);
    expect(r.normalForce).toBeCloseTo(5 * 9.8 * Math.cos(Math.PI / 6), 6);
    expect(r.drivingForce).toBeCloseTo(3 * 9.8 - 5 * 9.8 * 0.5, 6);
  });

  it("fica em equilíbrio estático quando |F_motriz| ≤ μs N", () => {
    const r = system.simulate({ ...base, muK: 0.5, muS: 0.5 });
    expect(r.state).toBe("static");
    expect(r.acceleration).toBe(0);
    expect(r.tension).toBeCloseTo(3 * 9.8, 6);
    expect(r.points.every((p) => p.x === 0 && p.v === 0)).toBe(true);
  });

  it("m2 desce quando F_motriz > μs N (a > 0)", () => {
    const r = system.simulate({ ...base, muK: 0, muS: 0 });
    expect(r.state).toBe("moving");
    expect(r.acceleration).toBeCloseTo((3 * 9.8 - 5 * 9.8 * 0.5) / 8, 6);
    expect(r.tension).toBeCloseTo(3 * (9.8 - r.acceleration), 6);
  });

  it("m1 desce o plano quando F_motriz < 0 (atrito inverte o sinal)", () => {
    const r = system.simulate({ ...base, m2: 0.5, muK: 0.1, muS: 0.1 });
    const N = 5 * 9.8 * Math.cos(Math.PI / 6);
    const F = 0.5 * 9.8 - 5 * 9.8 * 0.5;
    expect(r.acceleration).toBeCloseTo((F + 0.1 * N) / 5.5, 6);
    expect(r.acceleration).toBeLessThan(0);
  });

  it("x(t) e v(t) seguem o MRUV", () => {
    const r = system.simulate({ ...base, muK: 0, muS: 0 });
    const p = r.points[r.points.length - 1];
    expect(p.x).toBeCloseTo(0.5 * r.acceleration * p.t ** 2, 6);
    expect(p.v).toBeCloseTo(r.acceleration * p.t, 6);
  });
});
