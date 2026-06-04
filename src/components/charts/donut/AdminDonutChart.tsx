"use client";

import { useApexChartTheme } from "@/hooks/useApexChartTheme";
import { buildDonutChartOptions } from "@/lib/apex-chart-presets";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "@/components/charts/ReactApexChartClient";
import { useMemo } from "react";

export type AdminDonutChartProps = {
  labels: string[];
  series: number[];
  height?: number;
  centerLabel?: string;
  formatTotal?: (sum: number) => string;
  formatValue?: (val: number) => string;
  colors?: string[];
  loading?: boolean;
  emptyMessage?: string;
};

/**
 * Donut chart — pola komponen TailAdmin (`LineChartOne` / Sales Category CRM).
 * Semua modul admin memakai ini, bukan `ReactApexChart` + options inline.
 */
export default function AdminDonutChart({
  labels,
  series,
  height = 280,
  centerLabel = "Total",
  formatTotal,
  formatValue,
  colors,
  loading = false,
  emptyMessage = "Belum ada data.",
}: AdminDonutChartProps) {
  const { baseChart, isDark } = useApexChartTheme();

  const hasData = series.length > 0 && series.some((v) => Number(v) > 0);

  const options: ApexOptions = useMemo(
    () => ({
      ...buildDonutChartOptions(baseChart, {
        labels,
        isDark,
        centerLabel,
        formatTotal,
        formatValue,
        colors,
      }),
    }),
    [baseChart, labels, isDark, centerLabel, formatTotal, formatValue, colors],
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
        <ReactApexChart options={options} series={series} type="donut" height={height} />
      </div>
    </div>
  );
}
