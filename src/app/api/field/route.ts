import { getFieldPayload } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getFieldPayload();
  if (!payload) return NextResponse.json({ error: "لا توجد دورة مفتوحة" }, { status: 404 });
  return NextResponse.json(payload);
}
