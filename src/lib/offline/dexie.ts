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

export interface OfflineCycleDraft {
  cycleId: number;
  status: "saved" | "pending" | "synced" | "error";
  savedAt: string;
  syncedAt: string | null;
  readingsCount: number;
  pendingCount: number;
}

export const offlineDb = new Dexie("WaterBillingDB") as Dexie & {
  readings: EntityTable<OfflineReading, "id">;
  cycleDrafts: EntityTable<OfflineCycleDraft, "cycleId">;
};

offlineDb.version(1).stores({
  readings: "++id, cycleId, apartmentId, syncStatus"
});

offlineDb.version(2).stores({
  readings: "++id, cycleId, apartmentId, syncStatus",
  cycleDrafts: "cycleId, status, savedAt"
});
