"use client";

import { useApexChartTheme } from "@/hooks/useApexChartTheme";
import { buildAreaChartOptions } from "@/lib/apex-chart-presets";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "@/components/charts/ReactApexChartClient";
import { useMemo } from "react";

export type AreaSeries = { name: string; data: number[] };

export type AdminAreaChartProps = {
  categories: string[];
  series: AreaSeries | AreaSeries[];
  height?: number;
  colors?: string[];
  formatY?: (val: number) => string;
  formatTooltipY?: (val: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  extraOptions?: Partial<ApexOptions>;
};

function hasData(series: AreaSeries | AreaSeries[]): boolean {
  const list = Array.isArray(series) ? series : [series];
  return list.some((s) => s.data.some((v) => Number(v) > 0));
}

export default function AdminAreaChart({
  categories,
  series,
  height = 280,
  colors,
  formatY,
  formatTooltipY,
  loading = false,
  emptyMessage = "Belum ada data.",
  extraOptions,
}: AdminAreaChartProps) {
  const { baseChart } = useApexChartTheme();

  const apexSeries = useMemo(() => {
    const list = Array.isArray(series) ? series : [series];
    return list.map((s) => ({ name: s.name, data: s.data }));
  }, [series]);

  const options: ApexOptions = useMemo(
    () =>
      buildAreaChartOptions(baseChart, categories, {
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
    [baseChart, categories, height, colors, formatY, formatTooltipY, extraOptions],
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
      <ReactApexChart options={options} series={apexSeries} type="area" height={height} />
    </div>
  );
}
