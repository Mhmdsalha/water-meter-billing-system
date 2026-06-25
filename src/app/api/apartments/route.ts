import { createApartment, getApartments } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ apartments: await getApartments(true) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apartment = await createApartment({
      number: String(body.number ?? ""),
      floor: body.floor === undefined || body.floor === "" ? null : Number(body.floor),
      ownerName: body.ownerName ?? null
    });
    return NextResponse.json({ apartment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}
