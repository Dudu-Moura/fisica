// Função serverless (Vercel): POST /api/drag
import { DragSystem } from "../backend/src/physics/DragSystem.js";
import { dragSchema } from "../backend/src/routes/schemas.js";
import { simulationFunction } from "../backend/src/serverless.js";

export const POST = simulationFunction(dragSchema, new DragSystem());
