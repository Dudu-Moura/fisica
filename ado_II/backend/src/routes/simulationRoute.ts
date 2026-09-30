import { Router } from "express";
import type { ZodType, ZodTypeDef } from "zod";
import type { PhysicalSystem } from "../physics/PhysicalSystem.js";
import { runSimulation } from "./runSimulation.js";

export function simulationRoute<Req, Res>(
  schema: ZodType<Req, ZodTypeDef, unknown>,
  system: PhysicalSystem<Req, Res>,
): Router {
  const router = Router();

  router.post("/", (req, res) => {
    const { status, body } = runSimulation(schema, system, req.body);
    res.status(status).json(body);
  });

  return router;
}
