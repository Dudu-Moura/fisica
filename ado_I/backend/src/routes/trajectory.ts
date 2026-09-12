import { Router } from "express";
import { z } from "zod";
import { DEFAULT_GRAVITY, DEFAULT_SAMPLES } from "@ado-i/shared";
import { computeTrajectory } from "../physics/projectile.js";

export const trajectoryRouter = Router();

const trajectoryBodySchema = z.object({
  initialSpeed: z.number().positive("initialSpeed must be > 0"),
  angleDeg: z
    .number()
    .min(0, "angleDeg must be >= 0")
    .max(90, "angleDeg must be <= 90"),
  initialHeight: z.number().min(0, "initialHeight must be >= 0"),
  gravity: z
    .number()
    .positive("gravity must be > 0")
    .default(DEFAULT_GRAVITY),
  samples: z
    .number()
    .int()
    .min(2)
    .max(1000)
    .optional()
    .default(DEFAULT_SAMPLES),
});

trajectoryRouter.post("/", (req, res) => {
  const parsed = trajectoryBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  const result = computeTrajectory(parsed.data);
  res.json(result);
});
