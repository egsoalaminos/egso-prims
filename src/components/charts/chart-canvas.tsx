import * as React from "react";
import {
  Chart,
  type ChartConfiguration,
  type ChartType,
  registerables,
} from "chart.js";

/**
 * Chart.js setup, deferred until a chart is actually mounted.
 *
 * This ran at module scope, which made the module impossible to tree-shake:
 * anything that reached it — including the "@/components" barrel — dragged the
 * whole of Chart.js along. Running it on first mount instead keeps the cost
 * with the pages that draw charts.
 */
let registered = false;
function ensureChartSetup(): void {
  if (registered) return;
  registered = true;
  Chart.register(...registerables);
  Chart.defaults.font.family = '"Inter", ui-sans-serif, system-ui, sans-serif';
  Chart.defaults.font.size = 11;
  readThemeDefaults();
}

/**
 * Axis text and gridlines, read from the live theme.
 *
 * These were the literals `#737373` and `#f5f5f5`, set once at module load.
 * Chart.js takes real colour values rather than CSS variables, so a literal
 * here never followed the design tokens — it had to be read out of them.
 *
 * Read once at module load. There is one design and no dark mode, so the ramp
 * cannot change underneath a mounted chart and there is nothing to watch.
 */

function readThemeDefaults(): void {
  if (typeof document === "undefined") return;
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  Chart.defaults.color = token("--color-neutral-500", "#737373");
  Chart.defaults.borderColor = token("--color-neutral-200", "#e4e0d7");

}


export interface ChartCanvasProps {
  config: ChartConfiguration<ChartType>;
  /** Canvas height in px (width is fluid). */
  height?: number;
  className?: string;
  /**
   * What this chart says, in a sentence — the accessible name of the graphic.
   * Falls back to a description built from the series names when omitted, but
   * a written one is always better: it can state the trend, not just the
   * shape.
   */
  summary?: string;
}

/** A number as it should be read aloud, not as it is plotted. */
function readValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toLocaleString("en-PH", { maximumFractionDigits: 2 });
  if (typeof v === "object") {
    // Scatter/bubble points arrive as {x, y}.
    const p = v as { y?: unknown };
    if (p.y !== undefined) return readValue(p.y);
  }
  return String(v);
}

/**
 * The chart's data as a table, for assistive technology.
 *
 * A `<canvas>` is a picture with no text in it: without this the entire
 * Reports module and every utilities dashboard is silent to a screen reader.
 * An `aria-label` alone would only give the title — this gives the numbers,
 * which is what the page is actually for.
 */
function ChartDataTable({ config, caption }: { config: ChartConfiguration<ChartType>; caption: string }) {
  const labels = (config.data?.labels ?? []) as unknown[];
  const datasets = config.data?.datasets ?? [];
  if (!labels.length || !datasets.length) return null;

  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Category</th>
          {datasets.map((d, i) => (
            <th key={i} scope="col">
              {d.label ?? `Series ${i + 1}`}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {labels.map((label, r) => (
          <tr key={r}>
            <th scope="row">{String(label)}</th>
            {datasets.map((d, i) => (
              <td key={i}>{readValue((d.data as unknown[])?.[r])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Managed Chart.js canvas: instantiates on mount, updates data/options in
 * place, and destroys on unmount.
 */
export function ChartCanvas({ config, height = 220, className, summary }: ChartCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    ensureChartSetup();
    const chart = new Chart(canvasRef.current, {
      ...config,
      options: { maintainAspectRatio: false, responsive: true, ...config.options },
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
    // Recreate only when the chart type changes; data updates go through the
    // effect below without a full teardown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.type]);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data = config.data;
    if (config.options) {
      chart.options = { maintainAspectRatio: false, responsive: true, ...config.options };
    }
    chart.update();
  }, [config.data, config.options]);

  const series = (config.data?.datasets ?? [])
    .map((d, i) => d.label ?? `series ${i + 1}`)
    .join(", ");
  const label =
    summary ?? (series ? `${config.type} chart showing ${series}` : `${config.type} chart`);

  return (
    <div className={className} style={{ height }}>
      {/*
       * The canvas is the picture and carries the name; the table beside it
       * carries the numbers. `aria-hidden` is wrong here — the graphic is the
       * primary content — so it is labelled as an image instead.
       */}
      <canvas ref={canvasRef} role="img" aria-label={label} />
      <ChartDataTable config={config} caption={label} />
    </div>
  );
}
