"use client";

import Dexie, { type EntityTable } from "dexie";

export interface OfflineReading {
  id?: number;
  cycleId: number;
  apartmentId: number;
  apartmentNumber: string;
  floor: number | null;
  ownerName: string | null;
  previousReading: number;
  currentReading: number | null;
  canEditPrevious?: boolean;
  fractionFromPrev: number;
  isRead: boolean;
  readAt: string | null;
  syncStatus: "pending" | "synced" | "error";
  notes: string | null;
}

export const offlineDb = new Dexie("WaterBillingDB") as Dexie & {
  readings: EntityTable<OfflineReading, "id">;
};

offlineDb.version(1).stores({
  readings: "++id, cycleId, apartmentId, syncStatus"
});
