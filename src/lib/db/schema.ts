import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const apartments = sqliteTable("apartments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: text("number").notNull().unique(),
  floor: integer("floor"),
  ownerName: text("owner_name"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`)
});

export const billingCycles = sqliteTable("billing_cycles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start").notNull(),
  weekEnd: text("week_end").notNull(),
  generatorCost: real("generator_cost").notNull(),
  totalCups: real("total_cups"),
  exactPricePerCup: real("exact_price_per_cup"),
  totalBilled: real("total_billed"),
  totalDiscrepancy: real("total_discrepancy"),
  status: text("status").default("open"),
  notes: text("notes"),
  clientRequestId: text("client_request_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`)
});

export const meterReadings = sqliteTable(
  "meter_readings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cycleId: integer("cycle_id").references(() => billingCycles.id),
    apartmentId: integer("apartment_id").references(() => apartments.id),
    previousReading: real("previous_reading").notNull(),
    currentReading: real("current_reading").notNull(),
    cupsConsumed: real("cups_consumed").notNull(),
    fractionFromPrev: real("fraction_from_prev").default(0),
    consumptionCost: real("consumption_cost"),
    rawAmount: real("raw_amount"),
    billedAmount: real("billed_amount"),
    fractionCarried: real("fraction_carried"),
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    readAt: text("read_at"),
    notes: text("notes")
  },
  (table) => ({
    cycleApartmentUnique: uniqueIndex("meter_readings_cycle_apartment_unique").on(table.cycleId, table.apartmentId)
  })
);

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  readingId: integer("reading_id").references(() => meterReadings.id),
  apartmentId: integer("apartment_id").references(() => apartments.id),
  cycleId: integer("cycle_id").references(() => billingCycles.id),
  amountDue: real("amount_due"),
  amountPaid: real("amount_paid").default(0),
  isPaid: integer("is_paid", { mode: "boolean" }).default(false),
  paidAt: text("paid_at"),
  collectedBy: text("collected_by")
});

export type Apartment = typeof apartments.$inferSelect;
export type BillingCycle = typeof billingCycles.$inferSelect;
export type MeterReading = typeof meterReadings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
