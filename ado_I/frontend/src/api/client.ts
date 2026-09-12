import type { TrajectoryRequest, TrajectoryResponse } from "@ado-i/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function fetchTrajectory(
  params: TrajectoryRequest,
): Promise<TrajectoryResponse> {
  const res = await fetch(`${API_BASE}/api/trajectory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<TrajectoryResponse>;
}
