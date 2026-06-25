"use client";

import { offlineDb, type OfflineReading } from "./dexie";

export async function saveFieldPayload(readings: OfflineReading[]) {
  await offlineDb.transaction("rw", offlineDb.readings, async () => {
    const incomingKeys = new Set(readings.map((reading) => `${reading.cycleId}:${reading.apartmentId}`));
    const localReadings = await offlineDb.readings.toArray();

    for (const local of localReadings) {
      const key = `${local.cycleId}:${local.apartmentId}`;
      if (!incomingKeys.has(key) && local.syncStatus !== "pending") {
        await offlineDb.readings.delete(local.id!);
      }
    }

    for (const reading of readings) {
      const existing = await offlineDb.readings
        .where("cycleId")
        .equals(reading.cycleId)
        .and((item) => item.apartmentId === reading.apartmentId)
        .first();

      if (!existing) {
        await offlineDb.readings.add(reading);
        continue;
      }

      const preserveLocalInput = existing.syncStatus === "pending" || existing.syncStatus === "error";
      await offlineDb.readings.update(existing.id!, {
        ...reading,
        id: existing.id,
        previousReading: preserveLocalInput ? existing.previousReading : reading.previousReading,
        currentReading: preserveLocalInput ? existing.currentReading : reading.currentReading,
        notes: preserveLocalInput ? existing.notes : reading.notes,
        isRead: preserveLocalInput ? existing.isRead : reading.isRead,
        readAt: preserveLocalInput ? existing.readAt : reading.readAt,
        syncStatus: preserveLocalInput ? existing.syncStatus : reading.syncStatus
      });
    }
  });
}

export async function markReading(
  reading: OfflineReading,
  currentReading: number,
  notes: string | null,
  previousReading = reading.previousReading
) {
  if (currentReading < previousReading) {
    throw new Error("القراءة الحالية لا يمكن أن تكون أقل من السابقة");
  }

  await offlineDb.readings.update(reading.id!, {
    previousReading,
    currentReading,
    notes,
    isRead: true,
    readAt: new Date().toISOString(),
    syncStatus: "pending"
  });
}

export async function syncPendingReadings() {
  const pending = await offlineDb.readings
    .filter((reading) => reading.syncStatus === "pending" || reading.syncStatus === "error")
    .toArray();
  if (pending.length === 0) return { synced: 0, finalizedCycles: [], pendingCycles: [], readyCycles: [] };

  const response = await fetch("/api/readings/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      readings: pending.map((reading) => ({
        cycleId: reading.cycleId,
        apartmentId: reading.apartmentId,
        previousReading: reading.previousReading,
        currentReading: reading.currentReading,
        notes: reading.notes
      }))
    })
  });

  if (!response.ok) {
    await offlineDb.readings.bulkUpdate(pending.map((reading) => ({ key: reading.id!, changes: { syncStatus: "error" } })));
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "تعذرت المزامنة");
  }

  const data = await response.json();
  await offlineDb.readings.bulkUpdate(pending.map((reading) => ({ key: reading.id!, changes: { syncStatus: "synced" } })));
  return {
    synced: pending.length,
    finalizedCycles: data.finalizedCycles ?? [],
    pendingCycles: data.pendingCycles ?? [],
    readyCycles: data.readyCycles ?? []
  };
}
