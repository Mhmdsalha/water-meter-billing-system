const STORAGE_PRECISION = 10;

export interface ReadingInput {
  apartmentId: number;
  apartmentNumber: string;
  previousReading: number;
  currentReading: number;
  fractionFromPrev: number;
}

export interface BillingResult {
  apartmentId: number;
  apartmentNumber: string;
  previousReading: number;
  currentReading: number;
  cupsConsumed: number;
  fractionFromPrev: number;
  consumptionCost: number;
  rawAmount: number;
  billedAmount: number;
  roundingAdjustment: number;
  fractionCarried: number;
}

function fixed(value: number) {
  return parseFloat(value.toFixed(STORAGE_PRECISION));
}

export function calculateBilling(
  generatorCost: number,
  readings: ReadingInput[]
): {
  totalCups: number;
  exactPricePerCup: number;
  results: BillingResult[];
  totalBilled: number;
  totalDiscrepancy: number;
} {
  const withConsumption = readings.map((reading) => {
    const cupsConsumed = fixed(reading.currentReading - reading.previousReading);
    if (cupsConsumed < 0) {
      throw new Error(`قراءة خاطئة في الشقة ${reading.apartmentNumber}: الاستهلاك سالب`);
    }
    return { ...reading, cupsConsumed };
  });

  const totalCups = fixed(withConsumption.reduce((sum, reading) => sum + reading.cupsConsumed, 0));

  if (totalCups === 0) {
    throw new Error("إجمالي الأكواب صفر، تحقق من القراءات");
  }

  const exactPricePerCup = generatorCost / totalCups;
  const results = withConsumption.map((reading) => {
    const consumptionCost = reading.cupsConsumed * exactPricePerCup;
    const rawAmount = fixed(consumptionCost + reading.fractionFromPrev);
    const billedAmount = rawAmount > Math.floor(rawAmount) ? Math.ceil(rawAmount) : rawAmount;

    return {
      apartmentId: reading.apartmentId,
      apartmentNumber: reading.apartmentNumber,
      previousReading: reading.previousReading,
      currentReading: reading.currentReading,
      cupsConsumed: reading.cupsConsumed,
      fractionFromPrev: reading.fractionFromPrev,
      consumptionCost,
      rawAmount,
      billedAmount,
      roundingAdjustment: 0,
      fractionCarried: fixed(rawAmount - billedAmount)
    };
  });

  const totalBilled = results.reduce((sum, reading) => sum + reading.billedAmount, 0);
  const totalDiscrepancy = fixed(generatorCost - totalBilled);

  return { totalCups, exactPricePerCup, results, totalBilled, totalDiscrepancy };
}
