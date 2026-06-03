import type { ApexOptions } from "apexcharts";

/** Warna grid/label ApexCharts selaras TailAdmin light & dark. */
export function getApexChartBase(isDark: boolean): ApexOptions {
  const labelColor = isDark ? "#98a2b3" : "#667085";
  const gridColor = isDark ? "#344054" : "#e5e7eb";

  return {
    chart: {
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent",
    },
    theme: { mode: isDark ? "dark" : "light" },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    xaxis: {
      labels: { style: { fontSize: "11px", colors: labelColor } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { fontSize: "11px", colors: labelColor } },
    },
    tooltip: { theme: isDark ? "dark" : "light" },
    legend: {
      labels: { colors: labelColor },
    },
  };
}
