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
assert.equal(result.results.reduce((sum, reading) => sum + reading.roundingAdjustment, 0), 2);

assert.throws(
  () =>
    calculateBilling(100, [
      { apartmentId: 1, apartmentNumber: "101", previousReading: 10, currentReading: 9, fractionFromPrev: 0 }
    ]),
  /الاستهلاك سالب/
);

console.log("Billing tests passed.");
