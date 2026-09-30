import type { ZodType, ZodTypeDef } from "zod";
import type { PhysicalSystem } from "../physics/PhysicalSystem.js";

export interface SimulationResult {
  status: number;
  body: unknown;
}

// Valida o corpo e roda a simulação. Independente de framework: usado pelo Express
// (Docker / dev local) e pelas funções serverless da Vercel (pasta api/).
export function runSimulation<Req, Res>(
  schema: ZodType<Req, ZodTypeDef, unknown>,
  system: PhysicalSystem<Req, Res>,
  input: unknown,
): SimulationResult {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: "Parâmetros inválidos", details: parsed.error.flatten() },
    };
  }

  try {
    return { status: 200, body: system.simulate(parsed.data) };
  } catch (err) {
    console.error(err);
    return { status: 500, body: { error: "Erro interno ao simular" } };
  }
}
