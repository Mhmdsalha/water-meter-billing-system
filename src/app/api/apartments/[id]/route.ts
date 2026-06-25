import { getApartment, updateApartment } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const apartment = await getApartment(Number(params.id));
  if (!apartment) return NextResponse.json({ error: "الشقة غير موجودة" }, { status: 404 });
  return NextResponse.json({ apartment });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const apartment = await updateApartment(Number(params.id), {
      number: body.number,
      floor: body.floor === undefined ? undefined : body.floor === "" ? null : Number(body.floor),
      ownerName: body.ownerName,
      isActive: body.isActive
    });
    return NextResponse.json({ apartment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, { status: 400 });
  }
}
