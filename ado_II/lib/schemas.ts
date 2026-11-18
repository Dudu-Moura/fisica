import { z } from "zod";
import { DEFAULT_GRAVITY } from "./types.js";

const gravity = z.number().positive().default(DEFAULT_GRAVITY);
const samples = z.number().int().min(2).max(2000).default(200);
const duration = z.number().positive().optional();

export const inclinedPlaneSchema = z.object({
  m1: z.number().positive(),
  m2: z.number().positive(),
  angleDeg: z.number().min(0).max(90),
  muK: z.number().min(0),
  muS: z.number().min(0),
  gravity,
  duration,
  samples,
});

export const centripetalSchema = z.object({
  mode: z.enum(["string", "car"]),
  mass: z.number().positive(),
  radius: z.number().positive(),
  speed: z.number().positive(),
  muS: z.number().min(0).default(0),
  gravity,
  samples,
});

export const dragSchema = z.object({
  model: z.enum(["linear", "quadratic"]),
  mass: z.number().positive(),
  coefficient: z.number().positive(),
  gravity,
  duration,
  samples,
});

export type InclinedPlaneInput = z.infer<typeof inclinedPlaneSchema>;
export type CentripetalInput = z.infer<typeof centripetalSchema>;
export type DragInput = z.infer<typeof dragSchema>;
