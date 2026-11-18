import { useEffect, useRef, useState } from "react";
import type { TrajectoryRequest, TrajectoryResponse } from "../lib/types";
import { buscarTrajetoria } from "./api";
import { Controles } from "./Controles";
import { Grafico } from "./Grafico";
import { Resultados } from "./Resultados";

export type Params = Omit<TrajectoryRequest, "samples">;

const INICIAL: Params = {
  initialSpeed: 25,
  angleDeg: 45,
  initialHeight: 0,
  gravity: 9.81,
};

export function App() {
  const [params, setParams] = useState(INICIAL);
  const [trajetoria, setTrajetoria] = useState<TrajectoryResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [animando, setAnimando] = useState(false);
  const [indice, setIndice] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    const timer = setTimeout(() => {
      buscarTrajetoria({ ...params, samples: 120 }, controle.signal)
        .then((dados) => {
          setTrajetoria(dados);
          setErro(null);
          setIndice(dados.points.length - 1);
        })
        .catch((e: Error) => {
          if (e.name !== "AbortError") setErro(e.message);
        });
    }, 80);

    return () => {
      clearTimeout(timer);
      controle.abort();
    };
  }, [params]);

  function parar() {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setAnimando(false);
  }

  function animar() {
    if (!trajetoria) return;
    parar();
    setAnimando(true);

    const n = trajetoria.points.length;
    const duracao = Math.max(trajetoria.flightTime * 1000, 500);
    const inicio = performance.now();

    const passo = (agora: number) => {
      const p = Math.min((agora - inicio) / duracao, 1);
      setIndice(Math.round(p * (n - 1)));
      if (p < 1) animRef.current = requestAnimationFrame(passo);
      else setAnimando(false);
    };
    animRef.current = requestAnimationFrame(passo);
  }

  function mudar(campo: keyof Params, valor: number) {
    parar();
    setParams((p) => ({ ...p, [campo]: valor }));
  }

  const ponto = trajetoria?.points[indice];

  return (
    <>
      <header>
        <h1>Simulador de Lançamento de Projéteis</h1>
        <p>ADO I - Física · Eduardo Moura</p>
      </header>

      <main>
        <div className="lateral">
          <Controles params={params} onChange={mudar} />
          <Resultados trajetoria={trajetoria} erro={erro} />
          <button onClick={animando ? parar : animar} disabled={!trajetoria}>
            {animando ? "Parar" : "Animar lançamento"}
          </button>
        </div>

        <div className="area-grafico">
          <Grafico trajetoria={trajetoria} indice={indice} />
          {ponto && (
            <p className="posicao">
              t = {ponto.t.toFixed(2)} s &nbsp; x = {ponto.x.toFixed(2)} m &nbsp; y = {ponto.y.toFixed(2)} m
            </p>
          )}
        </div>
      </main>
    </>
  );
}
