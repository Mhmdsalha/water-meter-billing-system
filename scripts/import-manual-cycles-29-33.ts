import { batchSql, runSql } from "../src/lib/db/index";

type ManualReading = {
  apartmentNumber: string;
  previous: number;
  current: number;
  cups: number;
  cost: number;
  carried: number;
  due: number;
};

type ManualCycle = {
  invoiceNumber: number;
  weekStart: string;
  generatorCost: number;
  totalCups: number;
  rows: ManualReading[];
};

const previousCycle28Carried = new Map<string, number>([
  ["3", -0.29],
  ["2", -0.01],
  ["5", -0.34],
  ["1", -0.95],
  ["8", -0.89],
  ["7", -0.6],
  ["6", -0.52],
  ["9", -1],
  ["10", -0.94],
  ["4", -0.07]
]);

const cycles: ManualCycle[] = [
  {
    invoiceNumber: 29,
    weekStart: "2026-06-17",
    generatorCost: 327,
    totalCups: 20.6,
    rows: [
      { apartmentNumber: "3", previous: 47.7, current: 48.3, cups: 0.6, cost: 9.52, carried: -0.19, due: 10 },
      { apartmentNumber: "2", previous: 53.2, current: 54.7, cups: 1.5, cost: 23.81, carried: -0.84, due: 23 },
      { apartmentNumber: "5", previous: 356, current: 358, cups: 2, cost: 31.75, carried: -0.17, due: 32 },
      { apartmentNumber: "1", previous: 914, current: 916, cups: 2, cost: 31.75, carried: -0.9, due: 31 },
      { apartmentNumber: "8", previous: 3306, current: 3308.5, cups: 2.5, cost: 39.68, carried: -0.72, due: 39 },
      { apartmentNumber: "7", previous: 441.1, current: 442.6, cups: 1.5, cost: 23.81, carried: -0.68, due: 24 },
      { apartmentNumber: "6", previous: 488, current: 491, cups: 3, cost: 47.62, carried: -0.06, due: 48 },
      { apartmentNumber: "9", previous: 520, current: 522, cups: 2, cost: 31.75, carried: -0.25, due: 32 },
      { apartmentNumber: "10", previous: 534.5, current: 537, cups: 2.5, cost: 39.68, carried: -0.48, due: 40 },
      { apartmentNumber: "4", previous: 1424, current: 1427, cups: 3, cost: 47.62, carried: -0.32, due: 48 }
    ]
  },
  {
    invoiceNumber: 30,
    weekStart: "2026-06-25",
    generatorCost: 318,
    totalCups: 22,
    rows: [
      { apartmentNumber: "3", previous: 48.3, current: 48.9, cups: 0.6, cost: 8.67, carried: -0.67, due: 9 },
      { apartmentNumber: "2", previous: 54.7, current: 56.4, cups: 1.7, cost: 24.57, carried: -0.02, due: 25 },
      { apartmentNumber: "5", previous: 358, current: 360, cups: 2, cost: 28.91, carried: -0.42, due: 29 },
      { apartmentNumber: "1", previous: 916, current: 919.5, cups: 3.5, cost: 50.59, carried: -0.15, due: 51 },
      { apartmentNumber: "8", previous: 3308.5, current: 3311, cups: 2.5, cost: 36.14, carried: -0.04, due: 37 },
      { apartmentNumber: "7", previous: 442.6, current: 444.3, cups: 1.7, cost: 24.57, carried: -0.87, due: 24 },
      { apartmentNumber: "6", previous: 491, current: 493.5, cups: 2.5, cost: 36.14, carried: -0.44, due: 36 },
      { apartmentNumber: "9", previous: 522, current: 524.5, cups: 2.5, cost: 36.14, carried: -0.5, due: 36 },
      { apartmentNumber: "10", previous: 537, current: 540, cups: 3, cost: 43.36, carried: -0.79, due: 43 },
      { apartmentNumber: "4", previous: 1427, current: 1429, cups: 2, cost: 28.91, carried: -0.7, due: 29 }
    ]
  },
  {
    invoiceNumber: 31,
    weekStart: "2026-07-02",
    generatorCost: 336,
    totalCups: 21.55,
    rows: [
      { apartmentNumber: "3", previous: 48.9, current: 49.8, cups: 0.9, cost: 14.03, carried: -0.99, due: 14 },
      { apartmentNumber: "2", previous: 56.4, current: 57.95, cups: 1.55, cost: 24.17, carried: -0.45, due: 24 },
      { apartmentNumber: "5", previous: 360, current: 361.5, cups: 1.5, cost: 23.39, carried: -0.51, due: 23 },
      { apartmentNumber: "1", previous: 919.5, current: 923, cups: 3.5, cost: 54.57, carried: -0.56, due: 55 },
      { apartmentNumber: "8", previous: 3311, current: 3313, cups: 2, cost: 31.18, carried: -0.9, due: 31 },
      { apartmentNumber: "7", previous: 444.3, current: 445.9, cups: 1.6, cost: 24.95, carried: -0.3, due: 25 },
      { apartmentNumber: "6", previous: 493.5, current: 496, cups: 2.5, cost: 38.98, carried: -0.3, due: 39 },
      { apartmentNumber: "9", previous: 524.5, current: 526.5, cups: 2, cost: 31.18, carried: -0.36, due: 31 },
      { apartmentNumber: "10", previous: 540, current: 543, cups: 3, cost: 46.77, carried: -0.43, due: 47 },
      { apartmentNumber: "4", previous: 1429, current: 1432, cups: 3, cost: 46.77, carried: -0.79, due: 46 }
    ]
  },
  {
    invoiceNumber: 32,
    weekStart: "2026-07-09",
    generatorCost: 387.2,
    totalCups: 25.45,
    rows: [
      { apartmentNumber: "3", previous: 49.8, current: 50.8, cups: 1, cost: 15.21, carried: -0.96, due: 15 },
      { apartmentNumber: "2", previous: 57.95, current: 59.6, cups: 1.65, cost: 25.1, carried: -0.29, due: 25 },
      { apartmentNumber: "5", previous: 361.5, current: 364, cups: 2.5, cost: 38.04, carried: -0.13, due: 38 },
      { apartmentNumber: "1", previous: 923, current: 927, cups: 4, cost: 60.86, carried: -0.99, due: 60 },
      { apartmentNumber: "8", previous: 3313, current: 3316, cups: 3, cost: 45.64, carried: -0.72, due: 45 },
      { apartmentNumber: "7", previous: 445.9, current: 447.7, cups: 1.8, cost: 27.39, carried: -0.35, due: 28 },
      { apartmentNumber: "6", previous: 496, current: 499, cups: 3, cost: 45.64, carried: -0.32, due: 46 },
      { apartmentNumber: "9", previous: 526.5, current: 529, cups: 2.5, cost: 38.04, carried: -0.18, due: 38 },
      { apartmentNumber: "10", previous: 543, current: 546, cups: 3, cost: 45.64, carried: -0.65, due: 45 },
      { apartmentNumber: "4", previous: 1432, current: 1435, cups: 3, cost: 45.64, carried: -0.01, due: 46 }
    ]
  },
  {
    invoiceNumber: 33,
    weekStart: "2026-07-16",
    generatorCost: 329,
    totalCups: 22.7,
    rows: [
      { apartmentNumber: "3", previous: 50.8, current: 52.1, cups: 1.3, cost: 18.84, carried: -0.75, due: 19 },
      { apartmentNumber: "2", previous: 59.6, current: 61.5, cups: 1.9, cost: 27.54, carried: -0.18, due: 28 },
      { apartmentNumber: "5", previous: 364, current: 366, cups: 2, cost: 28.99, carried: -0.09, due: 29 },
      { apartmentNumber: "1", previous: 927, current: 930, cups: 3, cost: 43.48, carried: -0.13, due: 44 },
      { apartmentNumber: "8", previous: 3316, current: 3318.5, cups: 2.5, cost: 36.23, carried: -0.08, due: 37 },
      { apartmentNumber: "7", previous: 447.7, current: 449.7, cups: 2, cost: 28.99, carried: -0.97, due: 29 },
      { apartmentNumber: "6", previous: 499, current: 501, cups: 2, cost: 28.99, carried: -0.68, due: 29 },
      { apartmentNumber: "9", previous: 529, current: 531, cups: 2, cost: 28.99, carried: -0.14, due: 29 },
      { apartmentNumber: "10", previous: 546, current: 549, cups: 3, cost: 43.48, carried: -0.01, due: 44 },
      { apartmentNumber: "4", previous: 1435, current: 1438, cups: 3, cost: 43.48, carried: -0.37, due: 44 }
    ]
  }
];

async function main() {
  const apartmentRows = await runSql("SELECT id, number FROM apartments");
  const apartments = new Map(apartmentRows.rows.map((row) => [String(row.number), Number(row.id)]));

  await batchSql(
    [
      { sql: "DELETE FROM payments" },
      { sql: "DELETE FROM meter_readings" },
      { sql: "DELETE FROM billing_cycles" }
    ],
    "write"
  );

  let previousCarried = previousCycle28Carried;

  for (const cycle of cycles) {
    const totalBilled = cycle.rows.reduce((sum, row) => sum + row.due, 0);
    const exactPricePerCup = cycle.generatorCost / cycle.totalCups;
    const cycleResult = await runSql(
      `INSERT INTO billing_cycles
        (week_start, week_end, generator_cost, total_cups, exact_price_per_cup, total_billed, total_discrepancy, status, notes, client_request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'finalized', ?, ?)`,
      [
        cycle.weekStart,
        cycle.weekStart,
        cycle.generatorCost,
        cycle.totalCups,
        exactPricePerCup,
        totalBilled,
        cycle.generatorCost - totalBilled,
        `استيراد يدوي - فاتورة ${cycle.invoiceNumber}`,
        `manual-cycle-${cycle.invoiceNumber}`
      ]
    );
    const cycleId = Number(cycleResult.lastInsertRowid);

    for (const row of cycle.rows) {
      const apartmentId = apartments.get(row.apartmentNumber);
      if (!apartmentId) throw new Error(`Apartment ${row.apartmentNumber} not found`);
      const fractionFromPrev = previousCarried.get(row.apartmentNumber) ?? 0;
      const readingResult = await runSql(
        `INSERT INTO meter_readings
          (cycle_id, apartment_id, previous_reading, current_reading, cups_consumed, fraction_from_prev,
           consumption_cost, raw_amount, billed_amount, fraction_carried, is_read, read_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
        [
          cycleId,
          apartmentId,
          row.previous,
          row.current,
          row.cups,
          fractionFromPrev,
          row.cost,
          row.cost + fractionFromPrev,
          row.due,
          row.carried
        ]
      );
      const readingId = Number(readingResult.lastInsertRowid);
      await runSql(
        `INSERT INTO payments (reading_id, apartment_id, cycle_id, amount_due, amount_paid, is_paid)
         VALUES (?, ?, ?, ?, 0, 0)`,
        [readingId, apartmentId, cycleId, row.due]
      );
    }

    previousCarried = new Map(cycle.rows.map((row) => [row.apartmentNumber, row.carried]));
    console.log(
      `Imported manual cycle ${cycle.invoiceNumber}: cost=${cycle.generatorCost}, due=${totalBilled}, diff=${(cycle.generatorCost - totalBilled).toFixed(2)}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
