export function formatRupiah(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";

  const trillions = value / 1_000_000_000_000;
  const billions = value / 1_000_000_000;
  const millions = value / 1_000_000;
  const thousands = value / 1_000;

  function trim(n: number): string {
    return n % 1 === 0 ? n.toString() : n.toFixed(1).replace(/\.0$/, "");
  }

  if (value >= 1_000_000_000_000) return `Rp ${trim(trillions)} Triliun`;
  if (value >= 1_000_000_000) return `Rp ${trim(billions)} Miliar`;
  if (value >= 1_000_000) return `Rp ${trim(millions)} Juta`;
  if (value >= 1_000) return `Rp ${trim(thousands)} Ribu`;
  return `Rp ${value}`;
}
