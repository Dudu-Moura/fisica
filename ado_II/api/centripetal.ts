// Função serverless (Vercel): POST /api/centripetal
import { CentripetalSystem } from "../backend/src/physics/CentripetalSystem.js";
import { centripetalSchema } from "../backend/src/routes/schemas.js";
import { simulationFunction } from "../backend/src/serverless.js";

export const POST = simulationFunction(centripetalSchema, new CentripetalSystem());
