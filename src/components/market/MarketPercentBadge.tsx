type Props = {
  percent: number;
  compact?: boolean;
  filled?: boolean;
};

export default function MarketPercentBadge({
  percent,
  compact = false,
  filled = true,
}: Props) {
  const isUp = percent > 0.05;
  const isDown = percent < -0.05;
  const color = isUp ? "#059669" : isDown ? "#dc2626" : "#f59e0b";
  const label =
    percent > 0
      ? `+${Math.abs(percent).toFixed(1)}%`
      : percent < 0
        ? `-${Math.abs(percent).toFixed(1)}%`
        : "0.0%";

  if (filled) {
    return (
      <span
        className={`inline-block rounded font-bold text-white ${
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
        }`}
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded font-semibold ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ color, backgroundColor: `${color}18` }}
    >
      {isUp && "↑"}
      {isDown && "↓"}
      {label}
    </span>
  );
}
