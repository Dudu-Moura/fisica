import { useState } from "react";
import type { InclinedPlaneRequest, InclinedPlaneResponse } from "../../lib/types";
import { Slider } from "../Campos";
import { Cena } from "../Cena";
import { fmt } from "../format";
import { Grafico } from "../Grafico";
import { useSimulacao } from "../useSimulacao";
import { desenharPlano } from "./cenaPlano";

export function PlanoInclinado() {
  const [m1, setM1] = useState(5);
  const [m2, setM2] = useState(4);
  const [angulo, setAngulo] = useState(30);
  const [muK, setMuK] = useState(0.2);
  const [muS, setMuS] = useState(0.3);
  const [mesmoMu, setMesmoMu] = useState(true);

  const { resultado: r, erro } = useSimulacao<InclinedPlaneRequest, InclinedPlaneResponse>("inclined-plane", {
    m1,
    m2,
    angleDeg: angulo,
    muK,
    muS: mesmoMu ? muK : muS,
  });

  const pts = r?.points ?? [];
  const sentido =
    !r || r.state === "static"
      ? "parado (atrito estático segura)"
      : r.acceleration > 0
        ? "m₁ sobe o plano, m₂ desce"
        : "m₁ desce o plano, m₂ sobe";

  return (
    <div className="sistema">
      <div className="lateral">
        <fieldset>
          <legend>Parâmetros</legend>
          <Slider label="Massa do bloco m₁ (kg)" min={0.1} max={20} step={0.1} valor={m1} onChange={setM1} />
          <Slider label="Massa pendurada m₂ (kg)" min={0.1} max={20} step={0.1} valor={m2} onChange={setM2} />
          <Slider label="Ângulo θ (°)" min={0} max={80} step={1} valor={angulo} onChange={setAngulo} />
          <Slider label="Atrito cinético μk" min={0} max={1} step={0.01} valor={muK} onChange={setMuK} />

          <label className="check">
            <input type="checkbox" checked={mesmoMu} onChange={() => setMesmoMu(!mesmoMu)} />{" "}
            Usar μs = μk
          </label>
          {!mesmoMu && <Slider label="Atrito estático μs" min={0} max={1} step={0.01} valor={muS} onChange={setMuS} />}
        </fieldset>

        <fieldset>
          <legend>Resultados</legend>
          {erro && <p className="erro">{erro}</p>}
          <table className="resultados">
            <tbody>
              <tr><td>Aceleração a</td><td>{fmt(r?.acceleration, 3)} m/s²</td></tr>
              <tr><td>Tração T = m₂(g − a)</td><td>{fmt(r?.tension)} N</td></tr>
              <tr><td>Normal N = m₁g cos θ</td><td>{fmt(r?.normalForce)} N</td></tr>
              <tr><td>F motriz = m₂g − m₁g sen θ</td><td>{fmt(r?.drivingForce)} N</td></tr>
              <tr><td>Atrito</td><td>{fmt(r?.frictionForce)} N</td></tr>
            </tbody>
          </table>
          <p className="obs">Sentido: {sentido}</p>
        </fieldset>
      </div>

      <div className="principal">
        <Cena
          duracao={pts.at(-1)?.t ?? 0}
          desenhar={(ctx, w, h, t) => desenharPlano(ctx, w, h, t, { r, angulo, m1, m2 })}
        />
        <div className="graficos">
          <Grafico
            titulo="Posição x(t) = ½at²"
            yLabel="x (m)"
            series={[{ label: "x(t)", cor: "#222", pontos: pts.map((p) => ({ x: p.t, y: p.x })) }]}
          />
          <Grafico
            titulo="Velocidade v(t) = at"
            yLabel="v (m/s)"
            series={[{ label: "v(t)", cor: "#c00", pontos: pts.map((p) => ({ x: p.t, y: p.v })) }]}
          />
        </div>
      </div>
    </div>
  );
}
