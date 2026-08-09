import type { ChartData, ChartOptions } from "chart.js";

import { InformationCard } from "@/components/cards/information-card";
import { Skeleton } from "@/components/feedback/skeleton";
import { ChartCanvas } from "@/components/charts/chart-canvas";

/**
 * Categorical palette, taken from the seal.
 *
 * This was a seven-hue framework rainbow — blue, emerald, violet, orange, sky,
 * rose, amber — which is what a SaaS analytics product looks like and has
 * nothing to do with the office the charts belong to.
 *
 * The order matters. The first three are the seal's own colours at full
 * strength, so a two- or three-series chart (the common case: this year against
 * last, or budget against actual) reads as the municipality. Positions four
 * through seven step down in weight rather than reaching for new hues, so a
 * seven-category chart stays legible without ever leaving the family.
 *
 * Chart.js takes literal colours, not custom properties, so these cannot be
 * tokens. They are the same values as `--tone-*` and `theme.ts`, kept in step
 * by hand.
 */
export const chartPalette = [
  "#7a1d2b", // seal burgundy — the primary series
  "#a9822f", // seal gold
  "#1f5c3a", // seal green
  "#a8636f", // burgundy, lightened
  "#c9ab6f", // gold, lightened
  "#6b9880", // green, lightened
  "#6b6660", // warm ink, for the residual "other" slice
];

export interface ChartCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: { label: string; onClick?: () => void };
  meta?: string;
  loading?: boolean;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

/** Titled card that hosts any chart container. */
export function ChartCard({
  title,
  icon,
  action,
  meta,
  loading = false,
  height = 220,
  className,
  children,
}: ChartCardProps) {
  return (
    <InformationCard icon={icon} title={title} action={action} meta={meta} className={className}>
      {loading ? <Skeleton style={{ height }} className="w-full rounded-lg" /> : children}
    </InformationCard>
  );
}

const legendDefaults = {
  labels: {
    boxWidth: 8,
    boxHeight: 8,
    usePointStyle: true,
    pointStyle: "circle" as const,
  },
};

export function DonutChartContainer({
  data,
  options,
  height = 220,
  className,
}: {
  data: ChartData<"doughnut">;
  options?: ChartOptions<"doughnut">;
  height?: number;
  className?: string;
}) {
  return (
    <ChartCanvas
      height={height}
      className={className}
      config={{
        type: "doughnut",
        data,
        options: {
          cutout: "68%",
          plugins: { legend: { position: "bottom", ...legendDefaults } },
          ...options,
        },
      }}
    />
  );
}

export function BarChartContainer({
  data,
  options,
  height = 220,
  className,
}: {
  data: ChartData<"bar">;
  options?: ChartOptions<"bar">;
  height?: number;
  className?: string;
}) {
  return (
    <ChartCanvas
      height={height}
      className={className}
      config={{
        type: "bar",
        data,
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { border: { display: false }, ticks: { maxTicksLimit: 5 } },
          },
          ...options,
        },
      }}
    />
  );
}

export function LineChartContainer({
  data,
  options,
  height = 220,
  className,
}: {
  data: ChartData<"line">;
  options?: ChartOptions<"line">;
  height?: number;
  className?: string;
}) {
  return (
    <ChartCanvas
      height={height}
      className={className}
      config={{
        type: "line",
        data,
        options: {
          elements: {
            line: { tension: 0.35, borderWidth: 2 },
            point: { radius: 0, hoverRadius: 4 },
          },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { border: { display: false }, ticks: { maxTicksLimit: 5 } },
          },
          ...options,
        },
      }}
    />
  );
}
