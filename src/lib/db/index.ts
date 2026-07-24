import { createClient, type Client, type InArgs, type ResultSet } from "@libsql/client";

const databaseUrl = process.env.TURSO_DATABASE_URL || "file:database.sqlite";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const sqlite = createClient({
  url: databaseUrl,
  authToken: authToken || undefined
});

let initPromise: Promise<void> | null = null;

export async function initDb(client: Client = sqlite) {
  await client.batch(
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
          client_request_id TEXT,
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

  try {
    await client.execute("ALTER TABLE billing_cycles ADD COLUMN client_request_id TEXT");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes("duplicate")) {
      throw error;
    }
  }

  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS billing_cycles_client_request_unique ON billing_cycles(client_request_id)");
}

export async function ensureDb(client: Client = sqlite) {
  initPromise ??= initDb(client);
  await initPromise;
}

export async function allRows<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  args: InArgs = []
) {
  await ensureDb();
  const result = await sqlite.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function getRow<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  args: InArgs = []
) {
  const rows = await allRows<T>(sql, args);
  return rows[0];
}

export async function runSql(sql: string, args: InArgs = []) {
  await ensureDb();
  return sqlite.execute({ sql, args });
}

export async function batchSql(statements: { sql: string; args?: InArgs }[], mode: "read" | "write" | "deferred" = "write") {
  await ensureDb();
  return sqlite.batch(statements, mode);
}

export function insertedId(result: ResultSet) {
  return Number(result.lastInsertRowid);
}
