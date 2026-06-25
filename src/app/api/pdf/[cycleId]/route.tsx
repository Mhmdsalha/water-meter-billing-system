import { getCycleDetail } from "@/lib/db/queries";
import { generateCycleReportPdf } from "@/lib/pdf-report";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: { cycleId: string } }) {
  const detail = await getCycleDetail(Number(params.cycleId));
  if (!detail) return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });

  const buffer = await generateCycleReportPdf(detail.cycle, detail.readings);
  const url = new URL(request.url);
  const filename = `water-cycle-${detail.cycle.id}-${detail.cycle.weekStart}.pdf`;
  const disposition = url.searchParams.get("download")
    ? `attachment; filename="${filename}"`
    : `inline; filename="${filename}"`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition
    }
  });
}
