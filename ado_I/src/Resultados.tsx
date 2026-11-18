import type { TrajectoryResponse } from "../lib/types";

interface Props {
  trajetoria: TrajectoryResponse | null;
  erro: string | null;
}

const fmt = (v?: number) => (v === undefined ? "-" : v.toFixed(2));

export function Resultados({ trajetoria, erro }: Props) {
  return (
    <fieldset>
      <legend>Resultados</legend>
      {erro && <p className="erro">{erro}</p>}
      <table className="resultados">
        <tbody>
          <tr>
            <td>Alcance (R)</td>
            <td>{fmt(trajetoria?.range)} m</td>
          </tr>
          <tr>
            <td>Altura máxima (y<sub>max</sub>)</td>
            <td>{fmt(trajetoria?.maxHeight)} m</td>
          </tr>
          <tr>
            <td>Tempo de voo (t<sub>voo</sub>)</td>
            <td>{fmt(trajetoria?.flightTime)} s</td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
}
