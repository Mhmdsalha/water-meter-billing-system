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

function rawFraction(value: number) {
  return fixed(value - Math.floor(value));
}

function naturalBill(rawAmount: number) {
  return Math.max(0, Math.ceil(rawAmount));
}

function refreshCarriedFraction(result: BillingResult) {
  result.fractionCarried = fixed(result.rawAmount - result.billedAmount);
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
    const billedAmount = naturalBill(rawAmount);

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

  const targetTotal = Number.isInteger(generatorCost) ? generatorCost : Math.ceil(generatorCost);
  let totalBilled = results.reduce((sum, reading) => sum + reading.billedAmount, 0);
  let difference = targetTotal - totalBilled;

  if (difference > 0) {
    const topUpOrder = [...results].sort((a, b) => {
      const aPreviousCredit = Math.max(0, -a.fractionFromPrev);
      const bPreviousCredit = Math.max(0, -b.fractionFromPrev);
      return (
        bPreviousCredit - aPreviousCredit ||
        b.cupsConsumed - a.cupsConsumed ||
        b.rawAmount - a.rawAmount ||
        a.apartmentNumber.localeCompare(b.apartmentNumber, "ar")
      );
    });

    for (let index = 0; index < difference; index += 1) {
      const reading = topUpOrder[index % topUpOrder.length];
      reading.billedAmount += 1;
      reading.roundingAdjustment += 1;
      refreshCarriedFraction(reading);
    }
  }

  if (difference < 0) {
    const discountOrder = [...results].sort((a, b) => {
      const aFraction = rawFraction(a.rawAmount);
      const bFraction = rawFraction(b.rawAmount);
      const aIntegerPenalty = aFraction === 0 ? 1 : 0;
      const bIntegerPenalty = bFraction === 0 ? 1 : 0;
      return (
        aIntegerPenalty - bIntegerPenalty ||
        aFraction - bFraction ||
        b.fractionFromPrev - a.fractionFromPrev ||
        b.rawAmount - a.rawAmount ||
        a.apartmentNumber.localeCompare(b.apartmentNumber, "ar")
      );
    });

    for (let index = 0; index < Math.abs(difference); index += 1) {
      const reading = discountOrder[index % discountOrder.length];
      if (reading.billedAmount <= 0) continue;
      reading.billedAmount -= 1;
      reading.roundingAdjustment -= 1;
      refreshCarriedFraction(reading);
    }
  }

  totalBilled = results.reduce((sum, reading) => sum + reading.billedAmount, 0);
  const totalDiscrepancy = fixed(generatorCost - totalBilled);

  return { totalCups, exactPricePerCup, results, totalBilled, totalDiscrepancy };
}
