"use client";

/**
 * Demo statis — referensi TailAdmin "Sales Category".
 * Data dinamis: gunakan `AdminDonutChart`.
 */
import AdminDonutChart from "@/components/charts/donut/AdminDonutChart";

export default function DonutChartOne() {
  return (
    <AdminDonutChart
      labels={["Affiliate Program", "Direct Buy", "Adsense"]}
      series={[245, 180, 120]}
      centerLabel="Total"
      height={280}
    />
  );
}
