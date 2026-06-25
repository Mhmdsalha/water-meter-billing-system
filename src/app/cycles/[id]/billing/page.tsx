import { BillingTable } from "@/components/BillingTable";
import { CycleCostEditor } from "@/components/CycleCostEditor";
import { FinalizeButton } from "@/components/FinalizeButton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCycleDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CycleBillingPage({ params }: { params: { id: string } }) {
  const detail = await getCycleDetail(Number(params.id));
  if (!detail) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">مراجعة الفوترة</h1>
        <p className="mt-1 text-sm text-text-muted">أغلق الدورة بعد التأكد من كل القراءات.</p>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>المبلغ والإغلاق</CardTitle>
            <CardDescription>
              يمكن تعديل مبلغ الدورة حتى بعد الإغلاق، وسيتم إعادة حساب الفوترة والمدفوعات تلقائيا.
            </CardDescription>
          </div>
          <FinalizeButton cycleId={detail.cycle.id} disabled={detail.cycle.status === "finalized"} />
        </CardHeader>
        <CycleCostEditor cycle={detail.cycle} />
      </Card>
      <BillingTable cycle={detail.cycle} readings={detail.readings} />
    </div>
  );
}
