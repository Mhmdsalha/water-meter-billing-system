export function formatMoney(value: number | null | undefined, digits = 2) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("ar-SA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function formatCups(value: number | null | undefined, digits = 2) {
  return Number(value ?? 0).toFixed(digits);
}

export function toStorageNumber(value: number) {
  return parseFloat(value.toFixed(10));
}

export function todayIso() {
  return new Date().toISOString();
}
