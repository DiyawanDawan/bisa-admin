"use client";

import { useApexChartTheme } from "@/hooks/useApexChartTheme";
import { buildBarChartOptions } from "@/lib/apex-chart-presets";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type BarSeries = { name: string; data: number[] };

export type AdminBarChartProps = {
  categories: string[];
  series: BarSeries | BarSeries[];
  height?: number;
  horizontal?: boolean;
  colors?: string[];
  formatY?: (val: number) => string;
  formatTooltipY?: (val: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  extraOptions?: Partial<ApexOptions>;
};

function hasData(series: BarSeries | BarSeries[]): boolean {
  const list = Array.isArray(series) ? series : [series];
  return list.some((s) => s.data.some((v) => Number(v) > 0));
}

export default function AdminBarChart({
  categories,
  series,
  height = 280,
  horizontal = false,
  colors,
  formatY,
  formatTooltipY,
  loading = false,
  emptyMessage = "Belum ada data.",
  extraOptions,
}: AdminBarChartProps) {
  const { baseChart } = useApexChartTheme();

  const apexSeries = useMemo(() => {
    const list = Array.isArray(series) ? series : [series];
    return list.map((s) => ({ name: s.name, data: s.data }));
  }, [series]);

  const options: ApexOptions = useMemo(
    () =>
      buildBarChartOptions(baseChart, categories, horizontal, {
        chart: { ...baseChart.chart, height },
        colors,
        yaxis: formatY
          ? { labels: { formatter: (val: number) => formatY(val) } }
          : undefined,
        tooltip: formatTooltipY
          ? { y: { formatter: (val: number) => formatTooltipY(val) } }
          : undefined,
        ...extraOptions,
      }),
    [baseChart, categories, horizontal, height, colors, formatY, formatTooltipY, extraOptions],
  );

  if (loading) {
    return (
      <div
        className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
        style={{ height }}
      />
    );
  }

  if (!hasData(series)) {
    return <p className="py-12 text-center text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <ReactApexChart options={options} series={apexSeries} type="bar" height={height} />
    </div>
  );
}
