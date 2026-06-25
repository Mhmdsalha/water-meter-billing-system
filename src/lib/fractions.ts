export interface PreviousReadingSnapshot {
  apartmentId: number;
  currentReading: number | null;
  fractionCarried: number | null;
}

export interface NewCycleReadingSeed {
  apartmentId: number;
  previousReading: number;
  currentReading: number;
  fractionFromPrev: number;
}

export function seedReadingsForNewCycle(
  apartmentIds: number[],
  previousSnapshots: PreviousReadingSnapshot[]
): NewCycleReadingSeed[] {
  const previousByApartment = new Map(previousSnapshots.map((snapshot) => [snapshot.apartmentId, snapshot]));

  return apartmentIds.map((apartmentId) => {
    const previous = previousByApartment.get(apartmentId);
    const previousReading = Number(previous?.currentReading ?? 0);
    const fractionFromPrev = Number(previous?.fractionCarried ?? 0);

    return {
      apartmentId,
      previousReading,
      currentReading: previousReading,
      fractionFromPrev
    };
  });
}
