export const decimalReadingRegex = /^\d+(\.\d{1,4})?$/;

export function parseReadingValue(value: unknown, fieldName = "القراءة") {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || !decimalReadingRegex.test(value.trim())) {
    throw new Error(`${fieldName} يجب أن تكون رقما صحيحا أو عشريا حتى 4 خانات`);
  }

  return Number(value);
}

export function assertCurrentReading(previousReading: number, currentReading: number) {
  if (currentReading < previousReading) {
    throw new Error("القراءة الحالية لا يمكن أن تكون أقل من السابقة");
  }
}

export function assertGeneratorCost(generatorCost: number) {
  if (!Number.isFinite(generatorCost) || generatorCost <= 0) {
    throw new Error("تكلفة المولد يجب أن تكون أكبر من صفر");
  }
}
