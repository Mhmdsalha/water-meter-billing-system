import { createCycle, getCycles } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ cycles: await getCycles() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const readingDate = String(body.readingDate ?? body.weekStart ?? "");
    const cycle = await createCycle({
      weekStart: readingDate,
      weekEnd: String(body.weekEnd ?? readingDate),
      generatorCost: Number(body.generatorCost),
      notes: body.notes ?? null,
      clientRequestId: body.clientRequestId ?? null
    });
    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}
