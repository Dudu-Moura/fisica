import { describe, expect, it } from "vitest";
import { DragSystem } from "./DragSystem.js";

const system = new DragSystem();
const g = 9.8;

describe("DragSystem", () => {
  it("arrasto linear: v_t = mg/b, τ = m/b, t95 = τ ln 20", () => {
    const r = system.simulate({ model: "linear", mass: 2, coefficient: 4, gravity: g });
    expect(r.terminalVelocity).toBeCloseTo((2 * g) / 4, 6);
    expect(r.timeConstant).toBeCloseTo(0.5, 6);
    expect(r.timeTo95).toBeCloseTo(0.5 * Math.log(20), 6);
  });

  it("arrasto quadrático: v_t = √(mg/c), t95 = (v_t/g) atanh(0.95)", () => {
    const r = system.simulate({ model: "quadratic", mass: 80, coefficient: 0.25, gravity: g });
    const vt = Math.sqrt((80 * g) / 0.25);
    expect(r.terminalVelocity).toBeCloseTo(vt, 6);
    expect(r.timeConstant).toBeNull();
    expect(r.timeTo95).toBeCloseTo((vt / g) * Math.atanh(0.95), 6);
  });

  it("v(t95) ≈ 0,95 v_t nos dois modelos", () => {
    for (const model of ["linear", "quadratic"] as const) {
      const r = system.simulate({ model, mass: 1, coefficient: 0.5, gravity: g, duration: 1, samples: 2 });
      const probe = system.simulate({ model, mass: 1, coefficient: 0.5, gravity: g, duration: r.timeTo95, samples: 2 });
      expect(probe.points[1].v).toBeCloseTo(0.95 * r.terminalVelocity, 6);
    }
  });

  it("parte do repouso, satura em v_t e fica abaixo da queda livre", () => {
    const r = system.simulate({ model: "quadratic", mass: 1, coefficient: 0.1, gravity: g, duration: 30 });
    expect(r.points[0].v).toBe(0);
    expect(r.points[0].y).toBe(0);
    expect(r.points.at(-1)!.v).toBeCloseTo(r.terminalVelocity, 3);
    for (const p of r.points.slice(1)) {
      expect(p.v).toBeLessThan(p.vFree);
      expect(p.y).toBeLessThan(p.yFree);
    }
  });
});
