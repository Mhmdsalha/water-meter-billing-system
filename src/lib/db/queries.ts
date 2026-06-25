import { calculateBilling } from "@/lib/billing";
import { seedReadingsForNewCycle } from "@/lib/fractions";
import { assertCurrentReading, assertGeneratorCost, parseReadingValue } from "@/lib/validation";
import { allRows, batchSql, getRow, insertedId, runSql } from "./index";

export interface ApartmentRow {
  id: number;
  number: string;
  floor: number | null;
  ownerName: string | null;
  isActive: boolean;
  createdAt: string | null;
}

export interface CycleRow {
  id: number;
  weekStart: string;
  weekEnd: string;
  generatorCost: number;
  totalCups: number | null;
  exactPricePerCup: number | null;
  totalBilled: number | null;
  totalDiscrepancy: number | null;
  status: "open" | "finalized";
  notes: string | null;
  createdAt: string | null;
  readingsCount?: number;
  readCount?: number;
}

export interface ReadingRow {
  id: number;
  cycleId: number;
  apartmentId: number;
  apartmentNumber: string;
  floor: number | null;
  ownerName: string | null;
  previousReading: number;
  currentReading: number;
  cupsConsumed: number;
  fractionFromPrev: number;
  consumptionCost: number | null;
  rawAmount: number | null;
  billedAmount: number | null;
  fractionCarried: number | null;
  isRead: boolean;
  readAt: string | null;
  notes: string | null;
  amountPaid: number | null;
  isPaid: boolean | null;
  canEditPrevious?: boolean;
}

function bool(value: unknown) {
  return Boolean(Number(value ?? 0));
}

function normalizeApartment(row: Record<string, unknown>): ApartmentRow {
  return {
    id: Number(row.id),
    number: String(row.number),
    floor: row.floor == null ? null : Number(row.floor),
    ownerName: row.ownerName == null ? null : String(row.ownerName),
    isActive: bool(row.isActive),
    createdAt: row.createdAt == null ? null : String(row.createdAt)
  };
}

function normalizeCycle(row: Record<string, unknown>): CycleRow {
  return {
    id: Number(row.id),
    weekStart: String(row.weekStart),
    weekEnd: String(row.weekEnd),
    generatorCost: Number(row.generatorCost),
    totalCups: row.totalCups == null ? null : Number(row.totalCups),
    exactPricePerCup: row.exactPricePerCup == null ? null : Number(row.exactPricePerCup),
    totalBilled: row.totalBilled == null ? null : Number(row.totalBilled),
    totalDiscrepancy: row.totalDiscrepancy == null ? null : Number(row.totalDiscrepancy),
    status: row.status === "finalized" ? "finalized" : "open",
    notes: row.notes == null ? null : String(row.notes),
    createdAt: row.createdAt == null ? null : String(row.createdAt),
    readingsCount: row.readingsCount == null ? undefined : Number(row.readingsCount),
    readCount: row.readCount == null ? undefined : Number(row.readCount)
  };
}

function normalizeReading(row: Record<string, unknown>): ReadingRow {
  return {
    id: Number(row.id),
    cycleId: Number(row.cycleId),
    apartmentId: Number(row.apartmentId),
    apartmentNumber: String(row.apartmentNumber),
    floor: row.floor == null ? null : Number(row.floor),
    ownerName: row.ownerName == null ? null : String(row.ownerName),
    previousReading: Number(row.previousReading),
    currentReading: Number(row.currentReading),
    cupsConsumed: Number(row.cupsConsumed),
    fractionFromPrev: Number(row.fractionFromPrev ?? 0),
    consumptionCost: row.consumptionCost == null ? null : Number(row.consumptionCost),
    rawAmount: row.rawAmount == null ? null : Number(row.rawAmount),
    billedAmount: row.billedAmount == null ? null : Number(row.billedAmount),
    fractionCarried: row.fractionCarried == null ? null : Number(row.fractionCarried),
    isRead: bool(row.isRead),
    readAt: row.readAt == null ? null : String(row.readAt),
    notes: row.notes == null ? null : String(row.notes),
    amountPaid: row.amountPaid == null ? null : Number(row.amountPaid),
    isPaid: row.isPaid == null ? null : bool(row.isPaid),
    canEditPrevious: row.otherReadingsCount == null ? undefined : Number(row.otherReadingsCount) === 0
  };
}

export async function getApartments(includeInactive = false) {
  const rows = await allRows(
    `SELECT id, number, floor, owner_name as ownerName, is_active as isActive, created_at as createdAt
     FROM apartments
     ${includeInactive ? "" : "WHERE is_active = 1"}
     ORDER BY CAST(number AS INTEGER), number`
  );

  return rows.map(normalizeApartment);
}

export async function createApartment(input: { number: string; floor?: number | null; ownerName?: string | null }) {
  const number = input.number.trim();
  if (!number) throw new Error("رقم الشقة مطلوب");

  const result = await runSql("INSERT INTO apartments (number, floor, owner_name) VALUES (?, ?, ?)", [
    number,
    input.floor ?? null,
    input.ownerName?.trim() || null
  ]);

  return getApartment(insertedId(result));
}

export async function updateApartment(
  id: number,
  input: { number?: string; floor?: number | null; ownerName?: string | null; isActive?: boolean }
) {
  const current = await getApartment(id);
  if (!current) throw new Error("الشقة غير موجودة");

  await runSql("UPDATE apartments SET number = ?, floor = ?, owner_name = ?, is_active = ? WHERE id = ?", [
    input.number?.trim() || current.number,
    input.floor === undefined ? current.floor : input.floor,
    input.ownerName === undefined ? current.ownerName : input.ownerName?.trim() || null,
    input.isActive === undefined ? Number(current.isActive) : Number(input.isActive),
    id
  ]);

  return getApartment(id);
}

export async function getApartment(id: number) {
  const row = await getRow(
    `SELECT id, number, floor, owner_name as ownerName, is_active as isActive, created_at as createdAt
     FROM apartments
     WHERE id = ?`,
    [id]
  );

  return row ? normalizeApartment(row) : null;
}

export async function getApartmentHistory(id: number) {
  const apartment = await getApartment(id);
  if (!apartment) return null;

  const rows = await allRows(
    `SELECT
      mr.id, mr.cycle_id as cycleId, mr.apartment_id as apartmentId, a.number as apartmentNumber,
      a.floor, a.owner_name as ownerName, mr.previous_reading as previousReading,
      mr.current_reading as currentReading, mr.cups_consumed as cupsConsumed,
      mr.fraction_from_prev as fractionFromPrev, mr.consumption_cost as consumptionCost,
      mr.raw_amount as rawAmount, mr.billed_amount as billedAmount,
      mr.fraction_carried as fractionCarried, mr.is_read as isRead,
      mr.read_at as readAt, mr.notes, p.amount_paid as amountPaid, p.is_paid as isPaid,
      bc.week_start as weekStart, bc.week_end as weekEnd, bc.status as cycleStatus
     FROM meter_readings mr
     JOIN apartments a ON a.id = mr.apartment_id
     JOIN billing_cycles bc ON bc.id = mr.cycle_id
     LEFT JOIN payments p ON p.reading_id = mr.id
     WHERE mr.apartment_id = ?
     ORDER BY bc.week_start DESC, bc.id DESC`,
    [id]
  );

  return {
    apartment,
    readings: rows.map((row) => ({
      ...normalizeReading(row),
      weekStart: String(row.weekStart),
      weekEnd: String(row.weekEnd),
      cycleStatus: row.cycleStatus === "finalized" ? "finalized" : "open"
    }))
  };
}

export async function getCycles() {
  const rows = await allRows(
    `SELECT c.id, c.week_start as weekStart, c.week_end as weekEnd, c.generator_cost as generatorCost,
      c.total_cups as totalCups, c.exact_price_per_cup as exactPricePerCup,
      c.total_billed as totalBilled, c.total_discrepancy as totalDiscrepancy,
      c.status, c.notes, c.created_at as createdAt,
      COUNT(mr.id) as readingsCount,
      COALESCE(SUM(CASE WHEN mr.is_read = 1 THEN 1 ELSE 0 END), 0) as readCount
     FROM billing_cycles c
     LEFT JOIN meter_readings mr ON mr.cycle_id = c.id
     GROUP BY c.id
     ORDER BY c.week_start DESC, c.id DESC`
  );

  return rows.map(normalizeCycle);
}

export async function getCycle(id: number) {
  const row = await getRow(
    `SELECT id, week_start as weekStart, week_end as weekEnd, generator_cost as generatorCost,
      total_cups as totalCups, exact_price_per_cup as exactPricePerCup, total_billed as totalBilled,
      total_discrepancy as totalDiscrepancy, status, notes, created_at as createdAt
     FROM billing_cycles
     WHERE id = ?`,
    [id]
  );

  return row ? normalizeCycle(row) : null;
}

export async function getCycleDetail(id: number) {
  const cycle = await getCycle(id);
  if (!cycle) return null;

  const rows = await allRows(
    `SELECT
      mr.id, mr.cycle_id as cycleId, mr.apartment_id as apartmentId, a.number as apartmentNumber,
      a.floor, a.owner_name as ownerName, mr.previous_reading as previousReading,
      mr.current_reading as currentReading, mr.cups_consumed as cupsConsumed,
      mr.fraction_from_prev as fractionFromPrev, mr.consumption_cost as consumptionCost,
      mr.raw_amount as rawAmount, mr.billed_amount as billedAmount,
      mr.fraction_carried as fractionCarried, mr.is_read as isRead,
      mr.read_at as readAt, mr.notes, p.amount_paid as amountPaid, p.is_paid as isPaid,
      (SELECT COUNT(*) FROM meter_readings other
       WHERE other.apartment_id = mr.apartment_id AND other.cycle_id <> mr.cycle_id) as otherReadingsCount
     FROM meter_readings mr
     JOIN apartments a ON a.id = mr.apartment_id
     LEFT JOIN payments p ON p.reading_id = mr.id
     WHERE mr.cycle_id = ?
     ORDER BY CAST(a.number AS INTEGER), a.number`,
    [id]
  );

  return {
    cycle,
    readings: rows.map(normalizeReading)
  };
}

export async function getLatestOpenCycle() {
  const row = await getRow(
    `SELECT id, week_start as weekStart, week_end as weekEnd, generator_cost as generatorCost,
      total_cups as totalCups, exact_price_per_cup as exactPricePerCup, total_billed as totalBilled,
      total_discrepancy as totalDiscrepancy, status, notes, created_at as createdAt
     FROM billing_cycles
     WHERE status = 'open'
     ORDER BY week_start DESC, id DESC
     LIMIT 1`
  );

  return row ? normalizeCycle(row) : null;
}

export async function createCycle(input: { weekStart: string; weekEnd: string; generatorCost: number; notes?: string | null }) {
  assertGeneratorCost(input.generatorCost);
  if (!input.weekStart) throw new Error("تاريخ القراءة مطلوب");
  const readingDate = input.weekStart;
  const weekEnd = input.weekEnd || readingDate;

  const cycleResult = await runSql("INSERT INTO billing_cycles (week_start, week_end, generator_cost, notes) VALUES (?, ?, ?, ?)", [
    readingDate,
    weekEnd,
    input.generatorCost,
    input.notes?.trim() || null
  ]);
  const cycleId = insertedId(cycleResult);

  const apartments = await getApartments(false);
  const snapshots = (await allRows(
    `SELECT mr.apartment_id as apartmentId, mr.current_reading as currentReading,
      COALESCE(mr.fraction_carried, 0) as fractionCarried
     FROM meter_readings mr
     JOIN (
       SELECT apartment_id, MAX(cycle_id) as maxCycleId
       FROM meter_readings
       GROUP BY apartment_id
     ) latest ON latest.apartment_id = mr.apartment_id AND latest.maxCycleId = mr.cycle_id`
  )) as { apartmentId: number; currentReading: number | null; fractionCarried: number | null }[];

  const seeds = seedReadingsForNewCycle(
    apartments.map((apartment) => apartment.id),
    snapshots
  );

  await batchSql(
    seeds.map((seed) => ({
      sql: `INSERT INTO meter_readings
        (cycle_id, apartment_id, previous_reading, current_reading, cups_consumed, fraction_from_prev)
       VALUES (?, ?, ?, ?, 0, ?)`,
      args: [cycleId, seed.apartmentId, seed.previousReading, seed.currentReading, seed.fractionFromPrev]
    })),
    "write"
  );

  return getCycleDetail(cycleId);
}

export async function updateCycleGeneratorCost(id: number, generatorCost: number) {
  return updateCycleDetails(id, { generatorCost });
}

export async function updateCycleDetails(
  id: number,
  input: { weekStart?: string; generatorCost?: number | string; notes?: string | null }
) {
  const current = await getCycle(id);
  if (!current) throw new Error("الدورة غير موجودة");

  const weekStart = input.weekStart?.trim() || current.weekStart;
  if (!weekStart) throw new Error("تاريخ القراءة مطلوب");

  const generatorCost =
    input.generatorCost === undefined || input.generatorCost === null || input.generatorCost === ""
      ? current.generatorCost
      : Number(input.generatorCost);
  assertGeneratorCost(generatorCost);

  await runSql("UPDATE billing_cycles SET week_start = ?, week_end = ?, generator_cost = ?, notes = ? WHERE id = ?", [
    weekStart,
    weekStart,
    generatorCost,
    input.notes?.trim() || null,
    id
  ]);

  const detail = await getCycleDetail(id);
  const hasReadings = detail?.readings.some((reading) => reading.isRead && reading.currentReading >= reading.previousReading);

  if (current.status === "finalized" && hasReadings) {
    return finalizeCycle(id);
  }

  return getCycleDetail(id);
}

async function canEditPreviousReading(cycleId: number, apartmentId: number) {
  const row = await getRow<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM meter_readings
     WHERE apartment_id = ? AND cycle_id <> ?`,
    [apartmentId, cycleId]
  );

  return Number(row?.count ?? 0) === 0;
}

export async function updateReading(
  id: number,
  input: { currentReading: number | string; previousReading?: number | string | null; notes?: string | null }
) {
  const row = (await getRow(
    `SELECT mr.id, mr.previous_reading as previousReading, mr.apartment_id as apartmentId,
      mr.cycle_id as cycleId, bc.status
     FROM meter_readings mr
     JOIN billing_cycles bc ON bc.id = mr.cycle_id
     WHERE mr.id = ?`,
    [id]
  )) as { id: number; previousReading: number; apartmentId: number; cycleId: number; status: string } | undefined;

  if (!row) throw new Error("القراءة غير موجودة");

  const previousReading =
    input.previousReading === undefined || input.previousReading === null || input.previousReading === ""
      ? Number(row.previousReading)
      : parseReadingValue(input.previousReading, "القراءة السابقة");

  if (previousReading !== Number(row.previousReading) && !(await canEditPreviousReading(Number(row.cycleId), Number(row.apartmentId)))) {
    throw new Error("يمكن تعديل القراءة السابقة فقط عند أول قراءة للشقة");
  }

  const currentReading = parseReadingValue(input.currentReading, "القراءة الحالية");
  assertCurrentReading(previousReading, currentReading);
  const cupsConsumed = parseFloat((currentReading - previousReading).toFixed(10));

  await runSql(
    `UPDATE meter_readings
     SET previous_reading = ?, current_reading = ?, cups_consumed = ?, is_read = 1, read_at = datetime('now'), notes = ?
     WHERE id = ?`,
    [previousReading, currentReading, cupsConsumed, input.notes?.trim() || null, id]
  );

  if (row.status === "finalized") {
    return finalizeCycle(Number(row.cycleId));
  }

  return getCycleDetail(Number(row.cycleId));
}

export async function bulkUpsertReadings(
  readings: {
    cycleId: number;
    apartmentId: number;
    previousReading?: number | string | null;
    currentReading: number | string;
    notes?: string | null;
  }[]
) {
  const updated: ReadingRow[] = [];

  for (const reading of readings) {
    const existing = (await getRow("SELECT id FROM meter_readings WHERE cycle_id = ? AND apartment_id = ?", [
      reading.cycleId,
      reading.apartmentId
    ])) as { id: number } | undefined;
    if (!existing) throw new Error("قراءة الشقة غير موجودة في الدورة الحالية");

    const detail = await updateReading(existing.id, {
      previousReading: reading.previousReading,
      currentReading: reading.currentReading,
      notes: reading.notes
    });
    const updatedReading = detail?.readings.find((item) => item.id === existing.id);
    if (updatedReading) updated.push(updatedReading);
  }

  return updated;
}

export async function finalizeCycle(id: number) {
  const detail = await getCycleDetail(id);
  if (!detail) throw new Error("الدورة غير موجودة");

  const unreadCount = detail.readings.filter((reading) => !reading.isRead).length;
  if (unreadCount > 0) {
    throw new Error(`لا يمكن اعتماد الدورة قبل قراءة كل الشقق. المتبقي ${unreadCount}`);
  }

  const hasConsumption = detail.readings.some((reading) => reading.currentReading > reading.previousReading);
  if (!hasConsumption) {
    throw new Error("لا يمكن إغلاق الدورة قبل إدخال قراءة واحدة على الأقل");
  }

  const billing = calculateBilling(
    detail.cycle.generatorCost,
    detail.readings.map((reading) => ({
      apartmentId: reading.apartmentId,
      apartmentNumber: reading.apartmentNumber,
      previousReading: reading.previousReading,
      currentReading: reading.currentReading,
      fractionFromPrev: reading.fractionFromPrev
    }))
  );

  await batchSql(
    [
      ...billing.results.map((result) => ({
        sql: `UPDATE meter_readings
         SET cups_consumed = ?, consumption_cost = ?, raw_amount = ?, billed_amount = ?, fraction_carried = ?
         WHERE cycle_id = ? AND apartment_id = ?`,
        args: [result.cupsConsumed, result.consumptionCost, result.rawAmount, result.billedAmount, result.fractionCarried, id, result.apartmentId]
      })),
      { sql: "DELETE FROM payments WHERE cycle_id = ?", args: [id] },
      {
        sql: `INSERT INTO payments (reading_id, apartment_id, cycle_id, amount_due, amount_paid, is_paid)
          SELECT id, apartment_id, cycle_id, billed_amount, 0, 0
          FROM meter_readings
          WHERE cycle_id = ?`,
        args: [id]
      },
      {
        sql: `UPDATE billing_cycles
         SET total_cups = ?, exact_price_per_cup = ?, total_billed = ?, total_discrepancy = ?, status = 'finalized'
         WHERE id = ?`,
        args: [billing.totalCups, billing.exactPricePerCup, billing.totalBilled, billing.totalDiscrepancy, id]
      }
    ],
    "write"
  );

  return getCycleDetail(id);
}

export async function getDashboardData() {
  const openCycle = await getLatestOpenCycle();
  const cycles = await getCycles();
  const latestCycleId = openCycle?.id ?? cycles[0]?.id;
  const latestDetail = latestCycleId ? await getCycleDetail(latestCycleId) : null;
  const apartments = await getApartments(false);

  return {
    openCycle,
    latestDetail,
    apartmentsCount: apartments.length,
    cycles: cycles.slice(0, 4)
  };
}

export async function getFieldPayload() {
  const openCycle = await getLatestOpenCycle();
  if (!openCycle) return null;
  const detail = await getCycleDetail(openCycle.id);
  if (!detail) return null;

  return {
    cycle: openCycle,
    readings: detail.readings.map((reading) => ({
      cycleId: reading.cycleId,
      apartmentId: reading.apartmentId,
      apartmentNumber: reading.apartmentNumber,
      floor: reading.floor,
      ownerName: reading.ownerName,
      previousReading: reading.previousReading,
      currentReading: reading.isRead ? reading.currentReading : null,
      canEditPrevious: reading.canEditPrevious,
      fractionFromPrev: reading.fractionFromPrev,
      isRead: reading.isRead,
      readAt: reading.readAt,
      syncStatus: "synced" as const,
      notes: reading.notes
    }))
  };
}
