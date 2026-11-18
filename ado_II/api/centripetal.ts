import { CentripetalSystem } from "../lib/CentripetalSystem.js";
import { centripetalSchema } from "../lib/schemas.js";

export async function POST(request: Request): Promise<Response> {
  const parsed = centripetalSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  return Response.json(new CentripetalSystem().simulate(parsed.data));
}
