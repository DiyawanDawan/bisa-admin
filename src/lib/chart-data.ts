export function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export type ChartSeriesInput = { name?: string; data?: unknown[] | null };

export function normalizeChartSeries(
  series: ChartSeriesInput | ChartSeriesInput[] | null | undefined,
): { name: string; data: number[] }[] {
  const list = Array.isArray(series) ? series : series ? [series] : [];
  return list
    .filter((item): item is ChartSeriesInput => Boolean(item))
    .map((item) => ({
      name: item.name ?? "Series",
      data: asArray(item.data).map((v) => Number(v) || 0),
    }));
}

export function hasPositiveChartData(series: { data: number[] }[]): boolean {
  return series.some((s) => s.data.some((v) => Number(v) > 0));
}

export function asCategories(value: string[] | null | undefined): string[] {
  return asArray(value);
}
