import { useEffect, useRef } from "react";
import {
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  type ChartDataset,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, Legend, Title, Tooltip);
Chart.defaults.locale = "pt-BR";

type Ponto = { x: number; y: number };

export interface Serie {
  label: string;
  cor: string;
  pontos: Ponto[];
  tracejada?: boolean;
}

interface Props {
  titulo: string;
  series: Serie[];
  xLabel?: string;
  yLabel?: string;
  mesmaEscala?: boolean;
}

export function Grafico({ titulo, series, xLabel = "t (s)", yLabel = "", mesmaEscala = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"line", Ponto[]> | null>(null);

  useEffect(() => {
    const chart = new Chart<"line", Ponto[]>(canvasRef.current!, {
      type: "line",
      data: { datasets: [] },
      options: {
        animation: false,
        maintainAspectRatio: false,
        parsing: false,
        interaction: { mode: "nearest", axis: "x", intersect: false },
        scales: {
          x: { type: "linear", title: { display: true, text: xLabel } },
          y: { type: "linear", title: { display: true, text: yLabel } },
        },
        plugins: {
          title: { display: true, text: titulo, font: { size: 15 } },
          legend: { display: false },
        },
      },
    });
    chartRef.current = chart;
    return () => chart.destroy();
  }, [titulo, xLabel, yLabel]);

  useEffect(() => {
    const chart = chartRef.current!;
    chart.data.datasets = series.map(paraDataset);
    chart.options.plugins!.legend!.display = series.length > 1;

    const pts = series.flatMap((s) => s.pontos);
    const scales = chart.options.scales!;
    if (pts.length > 0) {
      if (mesmaEscala) {
        const r = arredondarCima(Math.max(...pts.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) * 1.2);
        scales.x!.min = scales.y!.min = -r;
        scales.x!.max = scales.y!.max = r;
      } else {
        scales.x!.min = Math.min(...pts.map((p) => p.x));
        scales.x!.max = Math.max(...pts.map((p) => p.x));
      }
    }
    chart.update("none");
  });

  return (
    <div className={mesmaEscala ? "grafico quadrado" : "grafico"}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function paraDataset(s: Serie): ChartDataset<"line", Ponto[]> {
  return {
    label: s.label,
    data: s.pontos,
    borderColor: s.cor,
    backgroundColor: s.cor,
    borderWidth: 2,
    borderDash: s.tracejada ? [6, 4] : [],
    pointRadius: 0,
  };
}

function arredondarCima(v: number): number {
  const pot = 10 ** Math.floor(Math.log10(v));
  return (Math.ceil((v / pot) * 2) / 2) * pot;
}
