import { getCycleDetail, updateCycleDetails } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const detail = await getCycleDetail(Number(params.id));
  if (!detail) return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const detail = await updateCycleDetails(Number(params.id), {
      weekStart: body.weekStart,
      generatorCost: body.generatorCost,
      notes: body.notes
    });
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}
