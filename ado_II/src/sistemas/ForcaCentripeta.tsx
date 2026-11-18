import { useState } from "react";
import type { CentripetalMode, CentripetalRequest, CentripetalResponse } from "../../lib/types";
import { Slider } from "../Campos";
import { Cena } from "../Cena";
import { fmt } from "../format";
import { Grafico } from "../Grafico";
import { useSimulacao } from "../useSimulacao";
import { desenharCircular, duracaoCircular } from "./cenaCircular";

const PISTAS = [
  { nome: "Asfalto seco", mu: 0.8 },
  { nome: "Asfalto molhado", mu: 0.5 },
  { nome: "Terra", mu: 0.35 },
  { nome: "Neve", mu: 0.2 },
  { nome: "Gelo", mu: 0.08 },
];

export function ForcaCentripeta() {
  const [modo, setModo] = useState<CentripetalMode>("string");
  const [massa, setMassa] = useState(0.5);
  const [raio, setRaio] = useState(1);
  const [velocidade, setVelocidade] = useState(4);
  const [muS, setMuS] = useState(0.8);

  const { resultado: r, erro } = useSimulacao<CentripetalRequest, CentripetalResponse>("centripetal", {
    mode: modo,
    mass: massa,
    radius: raio,
    speed: velocidade,
    muS: modo === "car" ? muS : undefined,
  });

  const carro = modo === "car";
  const pts = r?.points ?? [];
  const dadosCena = { r, modo, raio, velocidade };

  function trocarModo(novo: CentripetalMode) {
    setModo(novo);
    if (novo === "string") {
      setMassa(0.5);
      setRaio(1);
      setVelocidade(4);
    } else {
      setMassa(1000);
      setRaio(40);
      setVelocidade(15);
    }
  }

  return (
    <div className="sistema">
      <div className="lateral">
        <fieldset>
          <legend>Parâmetros</legend>

          <div className="opcoes">
            <label>
              <input type="radio" name="modo" checked={!carro} onChange={() => trocarModo("string")} /> Objeto preso a um fio
            </label>
            <label>
              <input type="radio" name="modo" checked={carro} onChange={() => trocarModo("car")} /> Carro numa curva plana
            </label>
          </div>

          {!carro ? (
            <>
              <Slider label="Massa m (kg)" min={0.05} max={10} step={0.05} valor={massa} onChange={setMassa} />
              <Slider label="Raio R (m)" min={0.1} max={5} step={0.05} valor={raio} onChange={setRaio} />
              <Slider label="Velocidade v (m/s)" min={0.5} max={40} step={0.1} valor={velocidade} onChange={setVelocidade} />
            </>
          ) : (
            <>
              <Slider label="Massa do carro m (kg)" min={100} max={5000} step={10} valor={massa} onChange={setMassa} />
              <Slider label="Raio da curva R (m)" min={5} max={200} step={1} valor={raio} onChange={setRaio} />
              <Slider label="Velocidade v (m/s)" min={1} max={60} step={0.5} valor={velocidade} onChange={setVelocidade} />
              <p className="obs">≈ {fmt(velocidade * 3.6, 0)} km/h</p>

              <div className="campo">
                <label>Pista</label>
                <select value={muS} onChange={(e) => setMuS(Number(e.target.value))}>
                  {PISTAS.map((p) => (
                    <option key={p.nome} value={p.mu}>
                      {p.nome} (μs = {p.mu})
                    </option>
                  ))}
                </select>
              </div>
              <Slider label="Atrito estático μs" min={0.05} max={1.2} step={0.01} valor={muS} onChange={setMuS} />
            </>
          )}
        </fieldset>

        <fieldset>
          <legend>Resultados</legend>
          {erro && <p className="erro">{erro}</p>}
          <table className="resultados">
            <tbody>
              <tr><td>Força centrípeta Fc = mv²/R</td><td>{fmt(r?.centripetalForce)} N</td></tr>
              <tr><td>Aceleração centrípeta v²/R</td><td>{fmt(r?.centripetalAcceleration)} m/s²</td></tr>
              <tr><td>Velocidade angular ω = v/R</td><td>{fmt(r?.angularVelocity, 3)} rad/s</td></tr>
              <tr><td>Período T = 2π/ω</td><td>{fmt(r?.period, 3)} s</td></tr>
              {carro && (
                <>
                  <tr><td>Atrito máximo μs·m·g</td><td>{fmt(r?.maxFriction)} N</td></tr>
                  <tr><td>v máx = √(μs·g·R)</td><td>{fmt(r?.maxSpeed)} m/s</td></tr>
                </>
              )}
            </tbody>
          </table>
          {carro && r && (
            <p className={r.skidding ? "obs erro" : "obs"}>
              {r.skidding ? "O carro derrapa: v > v máx" : "O carro faz a curva: v ≤ v máx"}
            </p>
          )}
        </fieldset>
      </div>

      <div className="principal">
        <Cena
          duracao={duracaoCircular(dadosCena)}
          pausaNoFim={0}
          desenhar={(ctx, w, h, t) => desenharCircular(ctx, w, h, t, dadosCena)}
        />
        <div className="graficos">
          <Grafico
            titulo="Trajetória (vista de cima)"
            xLabel="x (m)"
            yLabel="y (m)"
            mesmaEscala
            series={[{ label: "trajetória", cor: "#222", pontos: pts.map((p) => ({ x: p.x, y: p.y })) }]}
          />
          <Grafico
            titulo="Coordenadas em uma volta"
            yLabel="posição (m)"
            series={[
              { label: "x(t) = R cos(ωt)", cor: "#222", pontos: pts.map((p) => ({ x: p.t, y: p.x })) },
              { label: "y(t) = R sen(ωt)", cor: "#c00", pontos: pts.map((p) => ({ x: p.t, y: p.y })) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
