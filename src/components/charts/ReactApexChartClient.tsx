"use client";

import type { ComponentProps, ReactNode } from "react";
import dynamic from "next/dynamic";
import { Component, useEffect, useMemo, useState } from "react";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" style={{ minHeight: 120 }} />
  ),
});

type Props = ComponentProps<typeof ApexChart>;

type BoundaryState = { hasError: boolean };

/** Tangkap crash ApexCharts agar halaman admin tidak putih total. */
class ApexChartErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="py-12 text-center text-sm text-gray-500">
          Grafik gagal ditampilkan. Muat ulang halaman jika perlu.
        </p>
      );
    }
    return this.props.children;
  }
}

function seriesFingerprint(series: Props["series"]): string {
  try {
    return JSON.stringify(series ?? []);
  } catch {
    return String(Date.now());
  }
}

/** ApexCharts butuh width + mount client; hindari error `tooltip.shared` / dimensi. */
export default function ReactApexChartClient(props: Props) {
  const [mounted, setMounted] = useState(false);
  const fingerprint = useMemo(
    () => `${props.type ?? "chart"}-${seriesFingerprint(props.series)}`,
    [props.type, props.series],
  );

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

  return (
    <ApexChartErrorBoundary resetKey={fingerprint}>
      {/* Remount saat data berubah — update in-place ApexCharts sering crash (.length/.map). */}
      <ApexChart key={fingerprint} {...props} width={props.width ?? "100%"} />
    </ApexChartErrorBoundary>
  );
}
