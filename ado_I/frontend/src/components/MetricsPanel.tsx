import type { TrajectoryResponse } from "@ado-i/shared";

interface Props {
  trajectory: TrajectoryResponse | null;
  loading: boolean;
  error: string | null;
}

function format(value: number | undefined, digits = 2): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function MetricsPanel({ trajectory, loading, error }: Props) {
  return (
    <section className="panel metrics">
      <h2>Resultados</h2>
      {error && <p className="error">{error}</p>}
      <dl className="metrics-grid">
        <div>
          <dt>Alcance</dt>
          <dd>
            {loading && !trajectory ? "…" : format(trajectory?.range)}{" "}
            <span className="unit">m</span>
          </dd>
        </div>
        <div>
          <dt>Altura máxima</dt>
          <dd>
            {loading && !trajectory ? "…" : format(trajectory?.maxHeight)}{" "}
            <span className="unit">m</span>
          </dd>
        </div>
        <div>
          <dt>Tempo de voo</dt>
          <dd>
            {loading && !trajectory ? "…" : format(trajectory?.flightTime)}{" "}
            <span className="unit">s</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
