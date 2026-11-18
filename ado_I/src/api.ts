import type { TrajectoryRequest, TrajectoryResponse } from "../lib/types";

export async function buscarTrajetoria(
  params: TrajectoryRequest,
  signal: AbortSignal,
): Promise<TrajectoryResponse> {
  const res = await fetch("/api/trajectory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    const corpo = await res.json();
    throw new Error(corpo.error);
  }

  return res.json();
}
