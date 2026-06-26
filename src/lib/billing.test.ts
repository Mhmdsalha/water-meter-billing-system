import assert from "node:assert/strict";
import { calculateBilling } from "./billing";

const result = calculateBilling(201, [
  { apartmentId: 1, apartmentNumber: "101", previousReading: 100.3, currentReading: 108.7, fractionFromPrev: 0 },
  { apartmentId: 2, apartmentNumber: "102", previousReading: 250, currentReading: 257.5, fractionFromPrev: 0 },
  { apartmentId: 3, apartmentNumber: "103", previousReading: 180.6, currentReading: 185.1, fractionFromPrev: 0 }
]);

assert.equal(result.totalCups, 20.4);
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
const topUpApartment = carriedBalanceResult.results.find((reading) => reading.apartmentNumber === "1");
assert.equal(carriedBalanceResult.totalBilled, 318);
assert.equal(carriedBalanceResult.totalDiscrepancy, 0);
assert.equal(ammar?.rawAmount.toFixed(4), "23.8927");
assert.equal(ammar?.billedAmount, 24);
assert.equal(topUpApartment?.roundingAdjustment, 1);

assert.throws(
  () =>
    calculateBilling(100, [
      { apartmentId: 1, apartmentNumber: "101", previousReading: 10, currentReading: 9, fractionFromPrev: 0 }
    ]),
  /الاستهلاك سالب/
);

console.log("Billing tests passed.");
