// Função serverless (Vercel): POST /api/inclined-plane
import { InclinedPlaneSystem } from "../backend/src/physics/InclinedPlaneSystem.js";
import { inclinedPlaneSchema } from "../backend/src/routes/schemas.js";
import { simulationFunction } from "../backend/src/serverless.js";

export const POST = simulationFunction(inclinedPlaneSchema, new InclinedPlaneSystem());
