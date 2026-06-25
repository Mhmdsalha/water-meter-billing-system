const fs = require("node:fs");
const Database = require("better-sqlite3");
const { createClient } = require("@libsql/client");

function loadEnvLocal() {
  if (!fs.existsSync(".env.local")) return;
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] ||= value;
  }
}

loadEnvLocal();

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in .env.local");
}

if (!fs.existsSync("database.sqlite")) {
  throw new Error("database.sqlite was not found");
}

const local = new Database("database.sqlite", { readonly: true });
const remote = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function createSchema() {
  await remote.batch(
    [
      {
        sql: `CREATE TABLE IF NOT EXISTS apartments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          number TEXT NOT NULL UNIQUE,
          floor INTEGER,
          owner_name TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS billing_cycles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week_start TEXT NOT NULL,
          week_end TEXT NOT NULL,
          generator_cost REAL NOT NULL,
          total_cups REAL,
          exact_price_per_cup REAL,
          total_billed REAL,
          total_discrepancy REAL,
          status TEXT DEFAULT 'open',
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS meter_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cycle_id INTEGER REFERENCES billing_cycles(id),
          apartment_id INTEGER REFERENCES apartments(id),
          previous_reading REAL NOT NULL,
          current_reading REAL NOT NULL,
          cups_consumed REAL NOT NULL,
          fraction_from_prev REAL DEFAULT 0,
          consumption_cost REAL,
          raw_amount REAL,
          billed_amount REAL,
          fraction_carried REAL,
          is_read INTEGER DEFAULT 0,
          read_at TEXT,
          notes TEXT,
          UNIQUE(cycle_id, apartment_id)
        )`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reading_id INTEGER REFERENCES meter_readings(id),
          apartment_id INTEGER REFERENCES apartments(id),
          cycle_id INTEGER REFERENCES billing_cycles(id),
          amount_due REAL,
          amount_paid REAL DEFAULT 0,
          is_paid INTEGER DEFAULT 0,
          paid_at TEXT,
          collected_by TEXT
        )`
      }
    ],
    "write"
  );
}

function rows(table) {
  return local.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
}

async function migrate() {
  await createSchema();

  const apartments = rows("apartments");
  const cycles = rows("billing_cycles");
  const readings = rows("meter_readings");
  const payments = rows("payments");

  const statements = [
    { sql: "DELETE FROM payments" },
    { sql: "DELETE FROM meter_readings" },
    { sql: "DELETE FROM billing_cycles" },
    { sql: "DELETE FROM apartments" },
    ...apartments.map((row) => ({
      sql: `INSERT INTO apartments (id, number, floor, owner_name, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
      args: [row.id, row.number, row.floor, row.owner_name, row.is_active, row.created_at]
    })),
    ...cycles.map((row) => ({
      sql: `INSERT INTO billing_cycles
        (id, week_start, week_end, generator_cost, total_cups, exact_price_per_cup, total_billed, total_discrepancy, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.week_start,
        row.week_end,
        row.generator_cost,
        row.total_cups,
        row.exact_price_per_cup,
        row.total_billed,
        row.total_discrepancy,
        row.status,
        row.notes,
        row.created_at
      ]
    })),
    ...readings.map((row) => ({
      sql: `INSERT INTO meter_readings
        (id, cycle_id, apartment_id, previous_reading, current_reading, cups_consumed, fraction_from_prev,
          consumption_cost, raw_amount, billed_amount, fraction_carried, is_read, read_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.cycle_id,
        row.apartment_id,
        row.previous_reading,
        row.current_reading,
        row.cups_consumed,
        row.fraction_from_prev,
        row.consumption_cost,
        row.raw_amount,
        row.billed_amount,
        row.fraction_carried,
        row.is_read,
        row.read_at,
        row.notes
      ]
    })),
    ...payments.map((row) => ({
      sql: `INSERT INTO payments
        (id, reading_id, apartment_id, cycle_id, amount_due, amount_paid, is_paid, paid_at, collected_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.reading_id,
        row.apartment_id,
        row.cycle_id,
        row.amount_due,
        row.amount_paid,
        row.is_paid,
        row.paid_at,
        row.collected_by
      ]
    }))
  ];

  const chunkSize = 80;
  for (let index = 0; index < statements.length; index += chunkSize) {
    await remote.batch(statements.slice(index, index + chunkSize), "write");
  }

  console.log(
    JSON.stringify(
      {
        apartments: apartments.length,
        cycles: cycles.length,
        readings: readings.length,
        payments: payments.length
      },
      null,
      2
    )
  );
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
