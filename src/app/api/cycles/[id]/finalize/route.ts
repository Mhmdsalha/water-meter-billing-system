import { finalizeCycle } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(_: Request, { params }: { params: { id: string } }) {
  try {
    const detail = await finalizeCycle(Number(params.id));
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}
