import { useMemo, useState } from "react";
import type { DragModel, DragRequest, DragResponse } from "../../lib/types";
import { CampoNumero } from "../Campos";
import { Cena } from "../Cena";
import { fmt } from "../format";
import { Grafico, type Serie } from "../Grafico";
import { useSimulacao } from "../useSimulacao";
import { calcularQueda, desenharQueda } from "./cenaQueda";

const OBJETOS = [
  { nome: "Paraquedista (antes de abrir)", massa: 80, b: 15, c: 0.25 },
  { nome: "Paraquedas aberto", massa: 80, b: 150, c: 30 },
  { nome: "Bola de tênis", massa: 0.057, b: 0.03, c: 0.0012 },
  { nome: "Bola de boliche", massa: 7, b: 0.8, c: 0.01 },
  { nome: "Gota de chuva", massa: 3.4e-5, b: 3.7e-5, c: 4.1e-6 },
  { nome: "Folha de papel", massa: 0.005, b: 0.025, c: 0.012 },
];

const NOME_MODELO: Record<DragModel, string> = { linear: "linear", quadratic: "quadrático" };

export function Arrasto() {
  const [modelo, setModelo] = useState<DragModel>("quadratic");
  const [objeto, setObjeto] = useState(0);
  const [massa, setMassa] = useState(80);
  const [coef, setCoef] = useState(0.25);
  const [comparar, setComparar] = useState(false);

  const outroModelo: DragModel = modelo === "linear" ? "quadratic" : "linear";

  const { resultado: r, erro } = useSimulacao<DragRequest, DragResponse>("drag", {
    model: modelo,
    mass: massa,
    coefficient: coef,
  });
  const { resultado: outro } = useSimulacao<DragRequest, DragResponse>("drag", {
    model: outroModelo,
    mass: massa,
    coefficient: coef,
    duration: r?.points.at(-1)?.t ?? 10,
  });

  const queda = useMemo(() => calcularQueda(r), [r]);

  function trocarModelo(m: DragModel) {
    setModelo(m);
    const obj = OBJETOS[objeto];
    if (obj) setCoef(m === "linear" ? obj.b : obj.c);
  }

  function escolherObjeto(i: number) {
    setObjeto(i);
    const obj = OBJETOS[i];
    if (obj) {
      setMassa(obj.massa);
      setCoef(modelo === "linear" ? obj.b : obj.c);
    }
  }

  function mudarNumero(set: (n: number) => void, n: number) {
    set(n);
    setObjeto(-1);
  }

  const seriesV: Serie[] = [];
  const seriesY: Serie[] = [];
  if (r) {
    const t0 = r.points[0].t;
    const t1 = r.points[r.points.length - 1].t;
    const nome = `Com arrasto (${NOME_MODELO[modelo]})`;
    seriesV.push(
      { label: nome, cor: "#222", pontos: r.points.map((p) => ({ x: p.t, y: p.v })) },
      { label: "Queda livre v = gt", cor: "#c00", pontos: r.points.map((p) => ({ x: p.t, y: p.vFree })) },
      { label: "v terminal", cor: "#777", tracejada: true, pontos: [{ x: t0, y: r.terminalVelocity }, { x: t1, y: r.terminalVelocity }] },
    );
    seriesY.push(
      { label: nome, cor: "#222", pontos: r.points.map((p) => ({ x: p.t, y: p.y })) },
      { label: "Queda livre y = ½gt²", cor: "#c00", pontos: r.points.map((p) => ({ x: p.t, y: p.yFree })) },
    );
    if (comparar && outro) {
      const nomeOutro = `Com arrasto (${NOME_MODELO[outroModelo]})`;
      seriesV.push({ label: nomeOutro, cor: "#080", pontos: outro.points.map((p) => ({ x: p.t, y: p.v })) });
      seriesY.push({ label: nomeOutro, cor: "#080", pontos: outro.points.map((p) => ({ x: p.t, y: p.y })) });
    }
  }

  return (
    <div className="sistema">
      <div className="lateral">
        <fieldset>
          <legend>Parâmetros</legend>

          <div className="opcoes">
            <label>
              <input type="radio" name="modelo" checked={modelo === "linear"} onChange={() => trocarModelo("linear")} /> Linear: F = −bv
            </label>
            <label>
              <input type="radio" name="modelo" checked={modelo === "quadratic"} onChange={() => trocarModelo("quadratic")} /> Quadrático: F = −cv|v|
            </label>
          </div>

          <div className="campo">
            <label>Objeto</label>
            <select value={objeto} onChange={(e) => escolherObjeto(Number(e.target.value))}>
              {OBJETOS.map((o, i) => (
                <option key={o.nome} value={i}>
                  {o.nome}
                </option>
              ))}
              <option value={-1}>Personalizado</option>
            </select>
          </div>

          <div className="campo">
            <label>Massa m (kg)</label>
            <CampoNumero step="any" min={0} valor={massa} onChange={(n) => mudarNumero(setMassa, n)} />
          </div>
          <div className="campo">
            <label>{modelo === "linear" ? "Coeficiente b (kg/s)" : "Coeficiente c (kg/m)"}</label>
            <CampoNumero step="any" min={0} valor={coef} onChange={(n) => mudarNumero(setCoef, n)} />
          </div>

          <label className="check">
            <input type="checkbox" checked={comparar} onChange={() => setComparar(!comparar)} />{" "}
            Comparar com o modelo {NOME_MODELO[outroModelo]}
          </label>
        </fieldset>

        <fieldset>
          <legend>Resultados</legend>
          {erro && <p className="erro">{erro}</p>}
          <table className="resultados">
            <tbody>
              <tr>
                <td>Velocidade terminal {modelo === "linear" ? "mg/b" : "√(mg/c)"}</td>
                <td>{fmt(r?.terminalVelocity)} m/s</td>
              </tr>
              <tr><td></td><td>≈ {fmt((r?.terminalVelocity ?? 0) * 3.6, 0)} km/h</td></tr>
              {modelo === "linear" && <tr><td>Constante de tempo τ = m/b</td><td>{fmt(r?.timeConstant, 3)} s</td></tr>}
              <tr><td>Tempo até 95% de vt</td><td>{fmt(r?.timeTo95)} s</td></tr>
              {comparar && <tr><td>Tempo até 95% ({NOME_MODELO[outroModelo]})</td><td>{fmt(outro?.timeTo95)} s</td></tr>}
            </tbody>
          </table>
        </fieldset>
      </div>

      <div className="principal">
        <Cena duracao={queda?.fim ?? 0} desenhar={(ctx, w, h, t) => desenharQueda(ctx, w, h, t, r, queda)} />
        <div className="graficos">
          <Grafico titulo="Velocidade v(t)" yLabel="v (m/s)" series={seriesV} />
          <Grafico titulo="Distância percorrida y(t)" yLabel="y (m)" series={seriesY} />
        </div>
      </div>
    </div>
  );
}
