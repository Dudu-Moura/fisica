import { DragSystem } from "../lib/DragSystem.js";
import { dragSchema } from "../lib/schemas.js";

export async function POST(request: Request): Promise<Response> {
  const parsed = dragSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  return Response.json(new DragSystem().simulate(parsed.data));
}
