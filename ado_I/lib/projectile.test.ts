import { describe, expect, it } from "vitest";
import {
  computeMaxHeight,
  computeTrajectory,
  solveFlightTime,
} from "./projectile.js";

const G = 9.81;

describe("solveFlightTime", () => {
  it("lançamento a 45° do chão", () => {
    const v0 = 10;
    const v0y = v0 * Math.sin(Math.PI / 4);
    const T = solveFlightTime(0, v0y, G);
    const expected = (Math.SQRT2 * v0) / G;
    expect(T).toBeCloseTo(expected, 6);
  });

  it("retorna 0 se já está no chão sem subir", () => {
    expect(solveFlightTime(0, 0, G)).toBe(0);
    expect(solveFlightTime(0, -5, G)).toBe(0);
  });

  it("queda de uma altura com v0y = 0", () => {
    const y0 = 20;
    const T = solveFlightTime(y0, 0, G);
    const expected = Math.sqrt((2 * y0) / G);
    expect(T).toBeCloseTo(expected, 6);
  });
});

describe("computeMaxHeight", () => {
  it("soma v0y²/(2g) quando lançado para cima", () => {
    const y0 = 5;
    const v0y = 10;
    expect(computeMaxHeight(y0, v0y, G)).toBeCloseTo(
      y0 + (v0y * v0y) / (2 * G),
      6,
    );
  });

  it("retorna y0 se v0y <= 0", () => {
    expect(computeMaxHeight(8, 0, G)).toBe(8);
    expect(computeMaxHeight(8, -3, G)).toBe(8);
  });
});

describe("computeTrajectory", () => {
  it("alcance a 45° no chão", () => {
    const v0 = 20;
    const result = computeTrajectory({
      initialSpeed: v0,
      angleDeg: 45,
      initialHeight: 0,
      gravity: G,
      samples: 50,
    });

    const expectedRange = (v0 * v0) / G;
    expect(result.range).toBeCloseTo(expectedRange, 5);
    expect(result.flightTime).toBeCloseTo((Math.SQRT2 * v0) / G, 5);
    expect(result.maxHeight).toBeCloseTo((v0 * v0) / (4 * G), 5);
  });

  it("começa em (0, y0) e termina no chão", () => {
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

  it("lançamento horizontal de uma altura", () => {
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

  it("respeita o número de amostras", () => {
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
