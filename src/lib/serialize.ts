export function serializeItem<T extends { cost: bigint | null }>(
  item: T
): Omit<T, "cost"> & { cost: number | null } {
  return { ...item, cost: item.cost === null ? null : Number(item.cost) };
}
