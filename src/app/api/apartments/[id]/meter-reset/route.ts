import { replaceApartmentMeter } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const result = await replaceApartmentMeter(Number(params.id), {
      baselineReading: body.baselineReading,
      notes: body.notes ?? null
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}
