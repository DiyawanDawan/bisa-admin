"use client";

import { useApexChartTheme } from "@/hooks/useApexChartTheme";
import { buildPieChartOptions } from "@/lib/apex-chart-presets";
import { asArray } from "@/lib/chart-data";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "@/components/charts/ReactApexChartClient";
import { useMemo } from "react";

export type AdminPieChartProps = {
  labels: string[];
  series: number[];
  height?: number;
  colors?: string[];
  loading?: boolean;
  emptyMessage?: string;
};

export default function AdminPieChart({
  labels,
  series,
  height = 280,
  colors,
  loading = false,
  emptyMessage = "Belum ada data.",
}: AdminPieChartProps) {
  const { baseChart } = useApexChartTheme();
  const safeLabels = asArray(labels);
  const safeSeries = asArray(series).map((v) => Number(v) || 0);

  const hasData = safeSeries.length > 0 && safeSeries.some((v) => Number(v) > 0);

  const options: ApexOptions = useMemo(
    () => ({
      ...buildPieChartOptions(baseChart, safeLabels, colors),
      chart: { ...baseChart.chart, height },
    }),
    [baseChart, safeLabels, colors, height],
  );

  if (loading) {
    return (
      <div
        className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
        style={{ height }}
      />
    );
  }

  if (!hasData) {
    return <p className="py-12 text-center text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div className="mx-auto w-full max-w-sm">
        <ReactApexChart options={options} series={safeSeries} type="pie" height={height} />
      </div>
    </div>
  );
}
