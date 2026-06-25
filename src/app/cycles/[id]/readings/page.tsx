import { ReadingsEditor } from "@/components/ReadingsEditor";
import { getCycleDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CycleReadingsPage({ params }: { params: { id: string } }) {
  const detail = await getCycleDetail(Number(params.id));
  if (!detail) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">قراءات الدورة</h1>
        <p className="mt-1 text-sm text-text-muted">القراءات تتحقق من أن الحالي لا يقل عن السابق.</p>
      </div>
      <ReadingsEditor cycle={detail.cycle} readings={detail.readings} />
    </div>
  );
}
