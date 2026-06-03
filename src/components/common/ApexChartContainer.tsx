import React from "react";

type Props = {
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
};

/** Wrapper scroll grafik — pola LineChartOne / Statistics TailAdmin. */
export default function ApexChartContainer({
  children,
  minWidth,
  className = "",
}: Props) {
  return (
    <div className={`max-w-full overflow-x-auto custom-scrollbar ${className}`}>
      <div style={minWidth ? { minWidth } : undefined}>{children}</div>
    </div>
  );
}
