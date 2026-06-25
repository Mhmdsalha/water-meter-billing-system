import { bulkUpsertReadings, getCycleDetail } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type BulkReadingInput = {
  cycleId: number;
  apartmentId: number;
  previousReading?: number | string | null;
  currentReading: number | string;
  notes?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const readings: BulkReadingInput[] = Array.isArray(body.readings) ? body.readings : [];
    const updated = await bulkUpsertReadings(readings);
    const cycleIds = [...new Set(readings.map((reading) => Number(reading.cycleId)).filter(Boolean))];
    const finalizedCycles: { id: number; pdfUrl: string; totalCups: number | null; totalBilled: number | null }[] = [];
    const pendingCycles: { id: number; unreadCount: number }[] = [];
    const readyCycles: { id: number }[] = [];

    for (const cycleId of cycleIds) {
      const detail = await getCycleDetail(cycleId);
      if (!detail || detail.cycle.status === "finalized") {
        if (detail?.cycle.status === "finalized") {
          finalizedCycles.push({
            id: detail.cycle.id,
            pdfUrl: `/api/pdf/${detail.cycle.id}`,
            totalCups: detail.cycle.totalCups,
            totalBilled: detail.cycle.totalBilled
          });
        }
        continue;
      }

      const unreadCount = detail.readings.filter((reading) => !reading.isRead).length;
      if (unreadCount > 0) {
        pendingCycles.push({ id: cycleId, unreadCount });
        continue;
      }

      readyCycles.push({ id: cycleId });
    }

    return NextResponse.json({ readings: updated, finalizedCycles, pendingCycles, readyCycles });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}
