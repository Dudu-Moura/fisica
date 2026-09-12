import { describe, expect, it } from "vitest";
import {
  computeMaxHeight,
  computeTrajectory,
  solveFlightTime,
} from "./projectile.js";

const G = 9.81;

describe("solveFlightTime", () => {
  it("matches flat-ground 45° analytic time", () => {
    // y0 = 0, θ = 45°, T = 2*v0*sin(θ)/g = √2 * v0 / g
    const v0 = 10;
    const v0y = v0 * Math.sin(Math.PI / 4);
    const T = solveFlightTime(0, v0y, G);
    const expected = (Math.SQRT2 * v0) / G;
    expect(T).toBeCloseTo(expected, 6);
  });

  it("returns 0 when already on ground with no upward velocity", () => {
    expect(solveFlightTime(0, 0, G)).toBe(0);
    expect(solveFlightTime(0, -5, G)).toBe(0);
  });

  it("handles drop from height with zero vertical speed", () => {
    const y0 = 20;
    const T = solveFlightTime(y0, 0, G);
    const expected = Math.sqrt((2 * y0) / G);
    expect(T).toBeCloseTo(expected, 6);
  });
});

describe("computeMaxHeight", () => {
  it("adds v0y²/(2g) when launched upward", () => {
    const y0 = 5;
    const v0y = 10;
    expect(computeMaxHeight(y0, v0y, G)).toBeCloseTo(
      y0 + (v0y * v0y) / (2 * G),
      6,
    );
  });

  it("returns y0 when vertical velocity is not upward", () => {
    expect(computeMaxHeight(8, 0, G)).toBe(8);
    expect(computeMaxHeight(8, -3, G)).toBe(8);
  });
});

describe("computeTrajectory", () => {
  it("computes range for flat ground at 45°", () => {
    const v0 = 20;
    const result = computeTrajectory({
      initialSpeed: v0,
      angleDeg: 45,
      initialHeight: 0,
      gravity: G,
      samples: 50,
    });

    // R = v0² * sin(2θ) / g = v0² / g at 45°
    const expectedRange = (v0 * v0) / G;
    expect(result.range).toBeCloseTo(expectedRange, 5);
    expect(result.flightTime).toBeCloseTo((Math.SQRT2 * v0) / G, 5);
    expect(result.maxHeight).toBeCloseTo((v0 * v0) / (4 * G), 5);
  });

  it("starts at (0, y0) and ends on the ground", () => {
    const result = computeTrajectory({
      initialSpeed: 15,
      angleDeg: 30,
      initialHeight: 10,
      gravity: G,
      samples: 20,
    });

    expect(result.points[0]).toMatchObject({ t: 0, x: 0, y: 10 });
    const last = result.points[result.points.length - 1];
    expect(last.y).toBeCloseTo(0, 6);
    expect(last.t).toBeCloseTo(result.flightTime, 6);
    expect(last.x).toBeCloseTo(result.range, 5);
  });

  it("handles horizontal launch from a height", () => {
    const result = computeTrajectory({
      initialSpeed: 12,
      angleDeg: 0,
      initialHeight: 5,
      gravity: G,
      samples: 30,
    });

    expect(result.maxHeight).toBeCloseTo(5, 6);
    expect(result.flightTime).toBeCloseTo(Math.sqrt((2 * 5) / G), 5);
    expect(result.range).toBeCloseTo(12 * result.flightTime, 5);
  });

  it("respects custom sample count", () => {
    const result = computeTrajectory({
      initialSpeed: 10,
      angleDeg: 60,
      initialHeight: 0,
      gravity: G,
      samples: 11,
    });
    expect(result.points).toHaveLength(11);
  });
});
