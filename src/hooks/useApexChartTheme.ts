"use client";

import { getApexChartBase } from "@/lib/apex-chart-theme";
import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

/** Base ApexCharts options yang mengikuti ThemeProvider (light/dark). */
export function useApexChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const baseChart = useMemo(() => getApexChartBase(isDark), [isDark]);

  return { isDark, baseChart, theme };
}
