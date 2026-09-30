import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  Chart,
  type ChartDataset,
  type Plugin,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { PlaybackService } from '../core/playback.service';
import { ThemeService } from '../core/theme.service';
import { COLORS, type ColorRole } from './canvas-scene';

Chart.register(LineController, LineElement, PointElement, LinearScale, Legend, Tooltip);

export interface ChartSeries {
  label: string;
  color: ColorRole; // papel na paleta: a cor real depende do tema claro/escuro
  points: { x: number; y: number }[];
  dashed?: boolean;
  // Mostra o ponto "ao vivo" que acompanha a animação (padrão: true).
  marker?: boolean;
}

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SERIF = "'EB Garamond', Georgia, serif";

// Gráfico de linhas (Chart.js) com cursor sincronizado ao relógio da animação:
// uma linha vertical no instante atual e um ponto sobre cada série.
@Component({
  selector: 'app-line-chart',
  template: `<div class="chart-box"><canvas #canvas [attr.aria-label]="title()"></canvas></div>`,
})
export class LineChart {
  readonly title = input('');
  readonly series = input.required<ChartSeries[]>();
  readonly xLabel = input('t (s)');
  readonly yLabel = input('');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly playback = inject(PlaybackService, { optional: true });
  private readonly theme = inject(ThemeService);
  private chart?: Chart<'line', { x: number; y: number }[]>;
  private cursorT = 0;

  constructor() {
    afterNextRender(() => this.createChart());

    effect(() => {
      const series = this.series();
      this.theme.dark();
      if (!this.chart) return;
      this.applyTheme();
      this.chart.data.datasets = series.map(toDataset);
      this.chart.options.plugins!.legend!.display = series.length > 1;
      const xs = series.flatMap((s) => (s.points.length ? [s.points[0].x, s.points[s.points.length - 1].x] : []));
      const x = this.chart.options.scales!['x']!;
      x.min = xs.length ? Math.min(...xs) : undefined;
      x.max = xs.length ? Math.max(...xs) : undefined;
      this.chart.update('none');
    });

    if (this.playback) {
      const unsubscribe = this.playback.subscribe((t) => {
        this.cursorT = t;
        this.chart?.draw();
      });
      inject(DestroyRef).onDestroy(() => {
        unsubscribe();
        this.chart?.destroy();
      });
    }
  }

  private createChart(): void {
    const cursorPlugin: Plugin<'line'> = {
      id: 'playhead',
      afterDatasetsDraw: (chart) => {
        if (!this.playback) return;
        const { ctx, chartArea, scales } = chart;
        const x = scales['x'].getPixelForValue(this.cursorT);
        if (x < chartArea.left - 1 || x > chartArea.right + 1) return;

        ctx.save();
        ctx.strokeStyle = COLORS.red;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        this.series().forEach((s) => {
          if (s.marker === false || s.points.length === 0) return;
          ctx.beginPath();
          ctx.arc(x, scales['y'].getPixelForValue(yAt(s.points, this.cursorT)), 5, 0, Math.PI * 2);
          ctx.fillStyle = COLORS[s.color];
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = COLORS.surface;
          ctx.stroke();
        });
        ctx.restore();
      },
    };

    this.chart = new Chart<'line', { x: number; y: number }[]>(this.canvas().nativeElement, {
      type: 'line',
      data: { datasets: this.series().map(toDataset) },
      plugins: [cursorPlugin],
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: this.xLabel(), font: { family: SERIF, size: 15, style: 'italic' } },
            ticks: { maxTicksLimit: 8, font: { family: MONO, size: 11 } },
            grid: {},
            border: {},
          },
          y: {
            type: 'linear',
            title: { display: !!this.yLabel(), text: this.yLabel(), font: { family: SERIF, size: 15, style: 'italic' } },
            ticks: { maxTicksLimit: 7, font: { family: MONO, size: 11 } },
            grid: {},
            border: {},
          },
        },
        plugins: {
          legend: {
            display: this.series().length > 1,
            labels: { boxWidth: 18, boxHeight: 2, usePointStyle: false, font: { family: "'IBM Plex Sans', sans-serif", size: 12 } },
          },
          tooltip: {
            borderWidth: 1,
            cornerRadius: 2,
            titleFont: { family: MONO, size: 12 },
            bodyFont: { family: MONO, size: 12 },
            callbacks: {
              title: (items) => `t = ${items[0].parsed.x?.toFixed(2)} s`,
              label: (item) => ` ${item.dataset.label}: ${item.parsed.y?.toFixed(3)}`,
            },
          },
        },
      },
    });
    this.applyTheme();
    this.chart.update('none');
  }

  // Cores de eixos, grade e tooltip conforme o tema.
  private applyTheme(): void {
    const o = this.chart!.options;
    const grid = COLORS.line.replace(/[\d.]+\)$/, '0.4)');
    for (const axis of ['x', 'y'] as const) {
      const scale = o.scales![axis]!;
      scale.ticks!.color = COLORS.ink;
      scale.title!.color = COLORS.ink;
      scale.grid!.color = COLORS.line.replace(/[\d.]+\)$/, '0.08)');
      scale.border!.color = grid;
    }
    o.plugins!.legend!.labels!.color = COLORS.ink;
    const tip = o.plugins!.tooltip!;
    tip.backgroundColor = COLORS.surface;
    tip.borderColor = grid;
    tip.titleColor = COLORS.inkStrong;
    tip.bodyColor = COLORS.ink;
  }
}

function toDataset(s: ChartSeries): ChartDataset<'line', { x: number; y: number }[]> {
  return {
    label: s.label,
    data: s.points,
    borderColor: COLORS[s.color],
    backgroundColor: COLORS[s.color],
    borderWidth: 2,
    borderDash: s.dashed ? [6, 4] : [],
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHoverBorderWidth: 2,
    pointHoverBorderColor: COLORS.surface,
  };
}

// y interpolado em x numa série com x uniformemente espaçado.
function yAt(points: { x: number; y: number }[], x: number): number {
  const n = points.length;
  const x0 = points[0].x;
  const span = points[n - 1].x - x0;
  if (n < 2 || span <= 0) return points[0].y;
  const f = Math.max(0, Math.min(1, (x - x0) / span)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(f));
  return points[i].y + (points[i + 1].y - points[i].y) * (f - i);
}
