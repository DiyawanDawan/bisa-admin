"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" style={{ minHeight: 120 }} />
  ),
});

type Props = ComponentProps<typeof ApexChart>;

/** ApexCharts butuh width + mount client; hindari error `tooltip.shared` / dimensi. */
export default function ReactApexChartClient(props: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
        style={{ height: typeof props.height === "number" ? props.height : 280 }}
      />
    );
  }

  return <ApexChart {...props} width={props.width ?? "100%"} />;
}
