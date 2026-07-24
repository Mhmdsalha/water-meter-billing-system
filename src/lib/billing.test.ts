import assert from "node:assert/strict";
import { calculateBilling } from "./billing";

const result = calculateBilling(201, [
  { apartmentId: 1, apartmentNumber: "101", previousReading: 100.3, currentReading: 108.7, fractionFromPrev: 0 },
  { apartmentId: 2, apartmentNumber: "102", previousReading: 250, currentReading: 257.5, fractionFromPrev: 0 },
  { apartmentId: 3, apartmentNumber: "103", previousReading: 180.6, currentReading: 185.1, fractionFromPrev: 0 }
]);

assert.equal(result.totalCups, 20.4);
assert.equal(result.exactPricePerCup, 9.85);
assert.deepEqual(
  result.results.map((reading) => reading.billedAmount),
  [83, 74, 44]
);
assert.equal(result.totalBilled, 201);
assert.equal(result.totalDiscrepancy, 0);
assert.equal(
  Number(result.results[0].fractionCarried.toFixed(10)),
  Number((result.results[0].rawAmount - result.results[0].billedAmount).toFixed(10))
);
assert.equal(result.results.reduce((sum, reading) => sum + reading.roundingAdjustment, 0), -1);

const cycle34Result = calculateBilling(310.4, [
  { apartmentId: 1, apartmentNumber: "1", previousReading: 930, currentReading: 933, fractionFromPrev: -0.13 },
  { apartmentId: 2, apartmentNumber: "2", previousReading: 61.5, currentReading: 63.8, fractionFromPrev: -0.18 },
  { apartmentId: 3, apartmentNumber: "3", previousReading: 52.1, currentReading: 54, fractionFromPrev: -0.75 },
  { apartmentId: 4, apartmentNumber: "4", previousReading: 1438, currentReading: 1441, fractionFromPrev: -0.37 },
  { apartmentId: 5, apartmentNumber: "5", previousReading: 366, currentReading: 367, fractionFromPrev: -0.09 },
  { apartmentId: 6, apartmentNumber: "6", previousReading: 501, currentReading: 504, fractionFromPrev: -0.68 },
  { apartmentId: 7, apartmentNumber: "7", previousReading: 449.7, currentReading: 451.8, fractionFromPrev: -0.97 },
  { apartmentId: 8, apartmentNumber: "8", previousReading: 3318.5, currentReading: 3322, fractionFromPrev: -0.08 },
  { apartmentId: 9, apartmentNumber: "9", previousReading: 531, currentReading: 535, fractionFromPrev: -0.14 },
  { apartmentId: 10, apartmentNumber: "10", previousReading: 549, currentReading: 552, fractionFromPrev: -0.01 }
]);

assert.deepEqual(
  cycle34Result.results.map((reading) => reading.billedAmount),
  [35, 27, 21, 35, 12, 34, 24, 41, 46, 35]
);
assert.equal(cycle34Result.totalBilled, 310);
assert.equal(cycle34Result.totalDiscrepancy, 0.4);
assert.equal(cycle34Result.exactPricePerCup, 11.58);

const carriedBalanceResult = calculateBilling(318, [
  { apartmentId: 1, apartmentNumber: "1", previousReading: 910.5, currentReading: 914, fractionFromPrev: -0.9 },
  { apartmentId: 2, apartmentNumber: "2", previousReading: 51.5, currentReading: 53.2, fractionFromPrev: -0.84 },
  { apartmentId: 3, apartmentNumber: "3", previousReading: 47.1, currentReading: 47.7, fractionFromPrev: -0.19 },
  { apartmentId: 4, apartmentNumber: "4", previousReading: 1425, currentReading: 1427, fractionFromPrev: -0.32 },
  { apartmentId: 5, apartmentNumber: "5", previousReading: 356, currentReading: 358, fractionFromPrev: -0.17 },
  { apartmentId: 6, apartmentNumber: "6", previousReading: 488.5, currentReading: 491, fractionFromPrev: -0.06 },
  { apartmentId: 7, apartmentNumber: "7", previousReading: 441.1, currentReading: 442.8, fractionFromPrev: -0.68 },
  { apartmentId: 8, apartmentNumber: "8", previousReading: 3306, currentReading: 3308.5, fractionFromPrev: -0.72 },
  { apartmentId: 9, apartmentNumber: "9", previousReading: 519.5, currentReading: 522, fractionFromPrev: -0.25 },
  { apartmentId: 10, apartmentNumber: "10", previousReading: 534, currentReading: 537, fractionFromPrev: -0.48 }
]);

const ammar = carriedBalanceResult.results.find((reading) => reading.apartmentNumber === "7");
const borrowedApartment = carriedBalanceResult.results.find((reading) => reading.roundingAdjustment === 1);
assert.equal(carriedBalanceResult.totalBilled, 318);
assert.equal(carriedBalanceResult.totalDiscrepancy, 0);
assert.equal(ammar?.rawAmount.toFixed(4), "23.8850");
assert.equal(ammar?.billedAmount, 25);
assert.equal(borrowedApartment?.apartmentNumber, "7");
assert.equal(borrowedApartment?.fractionCarried < -1, true);

const rotatedBorrowResult = calculateBilling(
  318,
  [
    { apartmentId: 1, apartmentNumber: "1", previousReading: 910.5, currentReading: 914, fractionFromPrev: -0.9 },
    { apartmentId: 2, apartmentNumber: "2", previousReading: 51.5, currentReading: 53.2, fractionFromPrev: -0.84 },
    { apartmentId: 3, apartmentNumber: "3", previousReading: 47.1, currentReading: 47.7, fractionFromPrev: -0.19 },
    { apartmentId: 4, apartmentNumber: "4", previousReading: 1425, currentReading: 1427, fractionFromPrev: -0.32 },
    { apartmentId: 5, apartmentNumber: "5", previousReading: 356, currentReading: 358, fractionFromPrev: -0.17 },
    { apartmentId: 6, apartmentNumber: "6", previousReading: 488.5, currentReading: 491, fractionFromPrev: -0.06 },
    { apartmentId: 7, apartmentNumber: "7", previousReading: 441.1, currentReading: 442.8, fractionFromPrev: -0.68 },
    { apartmentId: 8, apartmentNumber: "8", previousReading: 3306, currentReading: 3308.5, fractionFromPrev: -0.72 },
    { apartmentId: 9, apartmentNumber: "9", previousReading: 519.5, currentReading: 522, fractionFromPrev: -0.25 },
    { apartmentId: 10, apartmentNumber: "10", previousReading: 534, currentReading: 537, fractionFromPrev: -0.48 }
  ],
  { borrowCountsByApartmentId: { 7: 1 } }
);
const rotatedBorrowedApartment = rotatedBorrowResult.results.find((reading) => reading.roundingAdjustment === 1);
assert.equal(rotatedBorrowedApartment?.apartmentNumber, "9");

assert.throws(
  () =>
    calculateBilling(100, [
      { apartmentId: 1, apartmentNumber: "101", previousReading: 10, currentReading: 9, fractionFromPrev: 0 }
    ]),
  /الاستهلاك سالب/
);

console.log("Billing tests passed.");
