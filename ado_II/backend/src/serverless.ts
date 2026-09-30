import type { ZodType, ZodTypeDef } from "zod";
import type { PhysicalSystem } from "./physics/PhysicalSystem.js";
import { runSimulation } from "./routes/runSimulation.js";

const MAX_BODY_BYTES = 4 * 1024;

const JSON_HEADERS = { "Cache-Control": "no-store" };

// Adaptador para funções serverless (API Web padrão: Request → Response), usado
// pelos arquivos em api/. Mesmas regras do Express: corpo ≤ 4 KB, JSON válido,
// validação zod e erros sem detalhes internos.
export function simulationFunction<Req, Res>(
  schema: ZodType<Req, ZodTypeDef, unknown>,
  system: PhysicalSystem<Req, Res>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      return Response.json({ error: "Corpo da requisição muito grande" }, { status: 413, headers: JSON_HEADERS });
    }

    let input: unknown;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) {
        return Response.json({ error: "Corpo da requisição muito grande" }, { status: 413, headers: JSON_HEADERS });
      }
      input = JSON.parse(text);
    } catch {
      return Response.json({ error: "JSON inválido" }, { status: 400, headers: JSON_HEADERS });
    }

    const { status, body } = runSimulation(schema, system, input);
    return Response.json(body, { status, headers: JSON_HEADERS });
  };
}
