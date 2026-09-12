import { useCallback, useEffect, useRef, useState } from "react";
import type { TrajectoryResponse } from "@ado-i/shared";
import { DEFAULT_GRAVITY } from "@ado-i/shared";
import { fetchTrajectory } from "./api/client";
import { playLaunchSound } from "./audio";
import { ParameterControls } from "./components/ParameterControls";
import { MetricsPanel } from "./components/MetricsPanel";
import { TrajectoryCanvas } from "./components/TrajectoryCanvas";
import { findPlanet } from "./planets";
import type { LaunchParams } from "./types";

const DEFAULT_PARAMS: LaunchParams = {
  initialSpeed: 25,
  angleDeg: 45,
  initialHeight: 0,
  gravity: DEFAULT_GRAVITY,
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function App() {
  const [params, setParams] = useState<LaunchParams>(DEFAULT_PARAMS);
  const debouncedParams = useDebouncedValue(params, 80);
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [projectileIndex, setProjectileIndex] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const planet = findPlanet(params.gravity);

  useEffect(() => {
    document.documentElement.dataset.planet = planet.id;
  }, [planet.id]);

  // Fluxo de atualização da interface: qualquer slider/select em
  // ParameterControls chama updateParam -> setParams -> muda `params`.
  // `params` passa por useDebouncedValue (80ms) antes de virar
  // `debouncedParams`, e é essa mudança que dispara este efeito, que
  // chama fetchTrajectory (nosso "calcular_trajetoria") na API. O
  // resultado atualiza `trajectory`, que por sua vez re-renderiza
  // MetricsPanel (R, ymax, tvoo) e TrajectoryCanvas (o gráfico).
  useEffect(() => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    fetchTrajectory({ ...debouncedParams, samples: 120 })
      .then((data) => {
        if (id !== requestIdRef.current) return;
        setTrajectory(data);
        setProjectileIndex(0);
        setAnimating(false);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (id !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Falha ao calcular");
        setTrajectory(null);
        setLoading(false);
      });
  }, [debouncedParams]);

  const stopAnimation = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    startRef.current = null;
    setAnimating(false);
  }, []);

  // Disparada pelo clique no botão "Animar lançamento": não recalcula
  // nada, só percorre os pontos já retornados pela API com
  // requestAnimationFrame, movendo o projétil ao longo da curva.
  const startAnimation = useCallback(() => {
    if (!trajectory || trajectory.points.length < 2) return;
    stopAnimation();
    playLaunchSound();
    setAnimating(true);
    setProjectileIndex(0);

    const flightMs = Math.max(trajectory.flightTime * 1000, 400);
    const points = trajectory.points;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / flightMs, 1);
      const idx = Math.min(
        Math.floor(progress * (points.length - 1)),
        points.length - 1,
      );
      setProjectileIndex(idx);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setAnimating(false);
        animRef.current = null;
        startRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, [trajectory, stopAnimation]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  // Chamada pelo `onChange` de cada controle em ParameterControls (input
  // range, input number ou o <select> de planeta/gravidade). Cancela uma
  // animação em curso e atualiza o parâmetro alterado, o que reinicia o
  // debounce acima e recalcula a trajetória.
  const updateParam = <K extends keyof LaunchParams>(
    key: K,
    value: LaunchParams[K],
  ) => {
    stopAnimation();
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="brand">ADO I — Física</p>
        <h1>Simulador de lançamento</h1>
        <p className="lede">
          Trajetórias de projéteis sem resistência do ar. Ajuste os parâmetros e
          veja alcance, altura máxima e tempo de voo atualizarem em tempo real.
        </p>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <ParameterControls params={params} onChange={updateParam} />
          <MetricsPanel
            trajectory={trajectory}
            loading={loading}
            error={error}
          />
          <div className="actions">
            <button
              type="button"
              className="btn-primary"
              onClick={startAnimation}
              disabled={!trajectory || animating || !!error}
            >
              {animating ? "Animando…" : "Animar lançamento"}
            </button>
            {animating && (
              <button
                type="button"
                className="btn-secondary"
                onClick={stopAnimation}
              >
                Parar
              </button>
            )}
          </div>
        </aside>

        <section className="stage" aria-label="Visualização da trajetória">
          <TrajectoryCanvas
            trajectory={trajectory}
            projectileIndex={projectileIndex}
            animating={animating}
            theme={planet}
          />
        </section>
      </main>
    </div>
  );
}
