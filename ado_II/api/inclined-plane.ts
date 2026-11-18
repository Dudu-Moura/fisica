import { InclinedPlaneSystem } from "../lib/InclinedPlaneSystem.js";
import { inclinedPlaneSchema } from "../lib/schemas.js";

export async function POST(request: Request): Promise<Response> {
  const parsed = inclinedPlaneSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  return Response.json(new InclinedPlaneSystem().simulate(parsed.data));
}
