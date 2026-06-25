import Database from "better-sqlite3";
import { calculateBilling } from "../src/lib/billing";

const db = new Database("database.sqlite");
const cycle = db
  .prepare("select id, generator_cost as generatorCost from billing_cycles order by id desc limit 1")
  .get() as { id: number; generatorCost: number };

const rows = db
  .prepare(
    `select mr.apartment_id as apartmentId, a.number as apartmentNumber,
      mr.previous_reading as previousReading, mr.current_reading as currentReading,
      mr.fraction_from_prev as fractionFromPrev,
      mr.billed_amount as billedAmount, mr.fraction_carried as fractionCarried
     from meter_readings mr
     join apartments a on a.id = mr.apartment_id
     where mr.cycle_id = ?
     order by cast(a.number as integer)`
  )
  .all(cycle.id) as {
  apartmentId: number;
  apartmentNumber: string;
  previousReading: number;
  currentReading: number;
  fractionFromPrev: number;
  billedAmount: number;
  fractionCarried: number;
}[];

const recalculated = calculateBilling(cycle.generatorCost, rows);
const mismatches = recalculated.results.filter((result, index) => {
  const expected = rows[index];
  return result.billedAmount !== expected.billedAmount || Number(result.fractionCarried.toFixed(2)) !== Number(expected.fractionCarried.toFixed(2));
});

console.log(
  JSON.stringify(
    {
      totalBilled: recalculated.totalBilled,
      mismatches
    },
    null,
    2
  )
);
