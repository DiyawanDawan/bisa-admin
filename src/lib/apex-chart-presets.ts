import type { ApexOptions } from "apexcharts";

/** Palet grafik brand BISA — selaras admin-design-system & mobile. */
export const BISA_CHART_COLORS = [
  "#135122",
  "#1a7a34",
  "#059669",
  "#22c55e",
  "#86efac",
  "#4ade80",
];

/** @deprecated Gunakan BISA_CHART_COLORS */
export const TAILADMIN_CHART_COLORS = BISA_CHART_COLORS;

type DonutPresetOpts = {
  labels: string[];
  isDark: boolean;
  centerLabel?: string;
  formatTotal?: (sum: number) => string;
  formatValue?: (val: number) => string;
  colors?: string[];
};

/** Donut — struktur TailAdmin, warna BISA. */
export function buildDonutChartOptions(
  baseChart: ApexOptions,
  opts: DonutPresetOpts,
): ApexOptions {
  const labelColor = opts.isDark ? "#98a2b3" : "#667085";
  const valueColor = opts.isDark ? "#f9fafb" : "#101828";

  return {
    ...baseChart,
    chart: { ...baseChart.chart, type: "donut" },
    colors: opts.colors ?? BISA_CHART_COLORS,
    labels: opts.labels,
    legend: {
      position: "bottom",
      fontSize: "12px",
      labels: { colors: labelColor },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: { color: labelColor, fontSize: "12px" },
            value: {
              color: valueColor,
              fontSize: "16px",
              fontWeight: 600,
              formatter: (val: string) =>
                opts.formatValue ? opts.formatValue(Number(val)) : val,
            },
            total: {
              show: true,
              label: opts.centerLabel ?? "Total",
              color: labelColor,
              fontSize: "12px",
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return opts.formatTotal ? opts.formatTotal(sum) : String(sum);
              },
            },
          },
        },
      },
    },
    tooltip: {
      ...baseChart.tooltip,
      y: {
        formatter: (val: number) =>
          opts.formatValue ? opts.formatValue(val) : String(val),
      },
    },
  };
}

/** Pie chart (kategori produk). */
export function buildPieChartOptions(
  baseChart: ApexOptions,
  labels: string[],
  colors?: string[],
): ApexOptions {
  return {
    ...baseChart,
    chart: { ...baseChart.chart, type: "pie" },
    colors: colors ?? BISA_CHART_COLORS,
    labels,
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
  };
}

/** Area / line — struktur TailAdmin, warna BISA. */
export function buildAreaChartOptions(
  baseChart: ApexOptions,
  categories: string[],
  extra?: Partial<ApexOptions>,
): ApexOptions {
  return {
    ...baseChart,
    colors: extra?.colors ?? [BISA_CHART_COLORS[0], BISA_CHART_COLORS[2]],
    chart: { ...baseChart.chart, type: "area", height: extra?.chart?.height ?? 310 },
    stroke: { curve: "smooth", width: 2 },
    dataLabels: { enabled: false },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.45, opacityTo: 0.05 },
    },
    xaxis: { ...baseChart.xaxis, categories },
    ...extra,
  };
}

/** Bar chart — warna BISA. */
export function buildBarChartOptions(
  baseChart: ApexOptions,
  categories: string[],
  horizontal = false,
  extra?: Partial<ApexOptions>,
): ApexOptions {
  return {
    ...baseChart,
    colors: extra?.colors ?? [BISA_CHART_COLORS[0]],
    chart: { ...baseChart.chart, type: "bar", height: extra?.chart?.height ?? 280 },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 4,
        columnWidth: horizontal ? undefined : "55%",
        barHeight: horizontal ? "60%" : undefined,
      },
    },
    dataLabels: { enabled: false },
    xaxis: { ...baseChart.xaxis, categories },
    ...extra,
  };
}
