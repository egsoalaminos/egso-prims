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
Chart.defaults.color = "#737373"; // neutral-500
Chart.defaults.borderColor = "#f5f5f5"; // neutral-100 gridlines

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
    chartRef.current = new Chart(canvasRef.current, {
      ...config,
      options: { maintainAspectRatio: false, responsive: true, ...config.options },
    });
    return () => {
      chartRef.current?.destroy();
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
