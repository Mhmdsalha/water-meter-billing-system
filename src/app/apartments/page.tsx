import { ApartmentManager } from "@/components/ApartmentManager";
import { getApartments } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ApartmentsPage() {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/80 bg-surface/70 p-4 shadow-panel backdrop-blur">
        <h1 className="text-2xl font-bold sm:text-3xl">إدارة الشقق</h1>
        <p className="mt-1 text-sm text-text-muted">إضافة الشقق وتفعيلها وتعطيلها مع حفظ تاريخ القراءات.</p>
      </div>
      <ApartmentManager initialApartments={await getApartments(true)} />
    </div>
  );
}
