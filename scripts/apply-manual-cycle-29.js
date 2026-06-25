const Database = require("better-sqlite3");

const db = new Database("database.sqlite");

const cycleId = db.prepare("select id from billing_cycles order by id desc limit 1").get().id;
const generatorCost = 327;
const totalCups = 20.6;
const exactPricePerCup = generatorCost / totalCups;

const manualRows = [
  { number: "1", name: "\u0645\u062d\u0645\u062f \u0623\u0645\u064a\u0646", previous: 914, current: 916, due: 31, carried: -0.9 },
  { number: "2", name: "\u0639\u0645\u0631\u0648 \u0627\u0644\u062d\u0644\u0628\u064a", previous: 53.2, current: 54.7, due: 23, carried: -0.84 },
  { number: "3", name: "\u0645\u062d\u0645\u062f \u0627\u0644\u062d\u0644\u0628\u064a", previous: 47.7, current: 48.3, due: 10, carried: -0.19 },
  { number: "4", name: "\u0623\u0628\u0648 \u0627\u0644\u0628\u0631\u0627\u0621 \u0633\u0644\u064a\u0645", previous: 1424, current: 1427, due: 48, carried: -0.32 },
  { number: "5", name: "\u0623\u0628\u0648 \u0639\u0645\u0631 \u0627\u0644\u0623\u0633\u062a\u0627\u0630", previous: 356, current: 358, due: 32, carried: -0.17 },
  { number: "6", name: "\u0623\u0628\u0648 \u0641\u0627\u0631\u0633 \u0633\u0644\u064a\u0645", previous: 488, current: 491, due: 48, carried: -0.06 },
  { number: "7", name: "\u0639\u0645\u0627\u0631 \u0627\u0644\u062c\u0645\u0627\u0644\u064a", previous: 441.1, current: 442.6, due: 24, carried: -0.68 },
  { number: "8", name: "\u0623\u0628\u0648 \u062d\u0633\u0627\u0645 \u0633\u0644\u064a\u0645", previous: 3306, current: 3308.5, due: 39, carried: -0.72 },
  { number: "9", name: "\u0623\u0628\u0648 \u0627\u0644\u0645\u062c\u062f \u0627\u0644\u062d\u0644\u0628\u064a", previous: 520, current: 522, due: 32, carried: -0.25 },
  { number: "10", name: "\u0623\u0628\u0648 \u0645\u062d\u0645\u062f \u0635\u0627\u0644\u062d\u0647", previous: 534.5, current: 537, due: 40, carried: -0.48 }
];

const fixed = (value, digits = 10) => Number(value.toFixed(digits));

const updateApartment = db.prepare("update apartments set owner_name = ? where number = ?");
const getApartment = db.prepare("select id from apartments where number = ?");
const updateReading = db.prepare(`
  update meter_readings
  set previous_reading = ?,
      current_reading = ?,
      cups_consumed = ?,
      fraction_from_prev = ?,
      consumption_cost = ?,
      raw_amount = ?,
      billed_amount = ?,
      fraction_carried = ?,
      is_read = 1,
      read_at = coalesce(read_at, datetime('now'))
  where cycle_id = ? and apartment_id = ?
`);
const updatePayment = db.prepare(`
  update payments
  set amount_due = ?
  where cycle_id = ? and apartment_id = ?
`);

const tx = db.transaction(() => {
  let totalBilled = 0;

  for (const row of manualRows) {
    updateApartment.run(row.name, row.number);
    const apartment = getApartment.get(row.number);
    if (!apartment) throw new Error(`Apartment not found: ${row.number}`);

    const cups = fixed(row.current - row.previous);
    const consumptionCost = cups * exactPricePerCup;
    const rawAmount = fixed(row.due + row.carried);
    const fractionFromPrev = fixed(rawAmount - consumptionCost);

    updateReading.run(
      row.previous,
      row.current,
      cups,
      fractionFromPrev,
      consumptionCost,
      rawAmount,
      row.due,
      row.carried,
      cycleId,
      apartment.id
    );
    updatePayment.run(row.due, cycleId, apartment.id);
    totalBilled += row.due;
  }

  db.prepare(`
    update billing_cycles
    set generator_cost = ?,
        total_cups = ?,
        exact_price_per_cup = ?,
        total_billed = ?,
        total_discrepancy = ?,
        status = 'finalized',
        notes = ?
    where id = ?
  `).run(
    generatorCost,
    totalCups,
    exactPricePerCup,
    totalBilled,
    fixed(generatorCost - totalBilled),
    "\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f \u0642\u064a\u0645 \u0627\u0644\u062f\u0648\u0631\u0629 \u0627\u0644\u064a\u062f\u0648\u064a\u0629 \u0631\u0642\u0645 29 \u0643\u0623\u0633\u0627\u0633 \u0644\u0644\u0643\u0633\u0648\u0631",
    cycleId
  );
});

tx();

console.log(`Applied manual cycle 29 baseline to cycle ${cycleId}`);
