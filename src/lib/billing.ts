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

type BorrowCounts = Map<number, number> | Record<number, number>;

interface BillingOptions {
  borrowCountsByApartmentId?: BorrowCounts;
}

function fixed(value: number) {
  return parseFloat(value.toFixed(STORAGE_PRECISION));
}

function naturalBill(rawAmount: number) {
  return Math.max(0, Math.ceil(rawAmount));
}

function getBorrowCount(counts: BorrowCounts | undefined, apartmentId: number) {
  if (!counts) return 0;
  if (counts instanceof Map) return counts.get(apartmentId) ?? 0;
  return counts[apartmentId] ?? 0;
}

function refreshCarriedFraction(result: BillingResult) {
  result.fractionCarried = fixed(result.rawAmount - result.billedAmount);
}

function projectedBorrowBalance(result: BillingResult) {
  return Math.abs(fixed(result.rawAmount - (result.billedAmount + 1)));
}

export function calculateBilling(
  generatorCost: number,
  readings: ReadingInput[],
  options: BillingOptions = {}
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
  const shortage = targetTotal - totalBilled;

  if (shortage > 0) {
    const borrowOrder = [...results].sort((a, b) => {
      const aBorrowCount = getBorrowCount(options.borrowCountsByApartmentId, a.apartmentId);
      const bBorrowCount = getBorrowCount(options.borrowCountsByApartmentId, b.apartmentId);
      const aProjectedBorrowBalance = projectedBorrowBalance(a);
      const bProjectedBorrowBalance = projectedBorrowBalance(b);

      return (
        aBorrowCount - bBorrowCount ||
        aProjectedBorrowBalance - bProjectedBorrowBalance ||
        b.cupsConsumed - a.cupsConsumed ||
        b.rawAmount - a.rawAmount ||
        a.apartmentNumber.localeCompare(b.apartmentNumber, "ar")
      );
    });

    for (let index = 0; index < shortage; index += 1) {
      const reading = borrowOrder[index % borrowOrder.length];
      reading.billedAmount += 1;
      reading.roundingAdjustment += 1;
      refreshCarriedFraction(reading);
    }
  }

  totalBilled = results.reduce((sum, reading) => sum + reading.billedAmount, 0);
  const totalDiscrepancy = fixed(generatorCost - totalBilled);

  return { totalCups, exactPricePerCup, results, totalBilled, totalDiscrepancy };
}
