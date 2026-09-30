import { z } from "zod";
import { DEFAULT_GRAVITY, DEFAULT_SAMPLES } from "@ado-ii/shared";

const gravity = z.number().positive().max(100).default(DEFAULT_GRAVITY);
const samples = z.number().int().min(2).max(2000).default(DEFAULT_SAMPLES);
const duration = z.number().positive().max(600).optional();

export const inclinedPlaneSchema = z.object({
  m1: z.number().positive().max(1000),
  m2: z.number().positive().max(1000),
  angleDeg: z.number().min(0).max(90),
  muK: z.number().min(0).max(2),
  muS: z.number().min(0).max(2),
  gravity,
  duration,
  samples,
}).strict();

export const centripetalSchema = z.object({
  mode: z.enum(["string", "car"]),
  mass: z.number().positive().max(1e6),
  radius: z.number().positive().max(1e4),
  speed: z.number().positive().max(1e3),
  muS: z.number().min(0).max(2).optional(),
  gravity,
  samples,
}).strict();

export const dragSchema = z.object({
  model: z.enum(["linear", "quadratic"]),
  mass: z.number().positive().max(1e6),
  coefficient: z.number().positive().max(1e4),
  gravity,
  duration,
  samples,
}).strict();
