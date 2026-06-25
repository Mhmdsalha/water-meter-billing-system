import { batchSql, initDb } from "./index";

async function seed() {
  await initDb();
  await batchSql(
    [
      ["101", 1, "محمد"],
      ["102", 1, "أحمد"],
      ["201", 2, "خالد"],
      ["202", 2, "سارة"],
      ["301", 3, "ليلى"]
    ].map((row) => ({
      sql: "INSERT OR IGNORE INTO apartments (number, floor, owner_name) VALUES (?, ?, ?)",
      args: row
    })),
    "write"
  );

  console.log("Database is ready with optional test apartments.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
