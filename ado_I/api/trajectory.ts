import { computeTrajectory, trajectorySchema } from "../lib/projectile.js";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = trajectorySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  return Response.json(computeTrajectory(parsed.data));
}
