import * as React from "react";
import {
  Chart,
  type ChartConfiguration,
  type ChartType,
  registerables,
} from "chart.js";

Chart.register(...registerables);

/* Library-wide Chart.js defaults matched to the design system. */
Chart.defaults.font.family = '"Inter", ui-sans-serif, system-ui, sans-serif';
Chart.defaults.font.size = 11;

/**
 * Axis text and gridlines, read from the live theme.
 *
 * These were the literals `#737373` and `#f5f5f5`, set once at module load.
 * Chart.js takes real colour values rather than CSS variables, so a literal
 * here never followed the theme: in dark mode the gridlines painted a
 * near-white `#f5f5f5` across a dark card, and the axis labels sat at roughly
 * 2:1 against it. They were also the old cold greys, so they were the last
 * cold thing left inside a chart after the palette was retoned to the seal.
 *
 * Read once at module load. With the theme system and dark mode gone the ramp
 * no longer changes underneath a mounted chart, so there is nothing to watch.
 */
/** Every mounted canvas, so a theme change can repaint what is already drawn. */
const liveCharts = new Set<Chart>();

function readThemeDefaults(): void {
  if (typeof document === "undefined") return;
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  Chart.defaults.color = token("--color-neutral-500", "#737373");
  Chart.defaults.borderColor = token("--color-neutral-200", "#e4e0d7");

}

readThemeDefaults();


export interface ChartCanvasProps {
  config: ChartConfiguration<ChartType>;
  /** Canvas height in px (width is fluid). */
  height?: number;
  className?: string;
}

/**
 * Managed Chart.js canvas: instantiates on mount, updates data/options in
 * place, and destroys on unmount.
 */
export function ChartCanvas({ config, height = 220, className }: ChartCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, {
      ...config,
      options: { maintainAspectRatio: false, responsive: true, ...config.options },
    });
    chartRef.current = chart;
    liveCharts.add(chart);
    return () => {
      liveCharts.delete(chart);
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

  return (
    <div className={className} style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
