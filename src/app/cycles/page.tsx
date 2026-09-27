import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { CycleDeleteButton } from "@/components/CycleDeleteButton";
import { getCycles } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { CalendarPlus, ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CyclesPage() {
  const cycles = await getCycles();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-bold text-accent">الأرشيف</p><h1 className="text-2xl font-bold sm:text-3xl">دورات الفوترة</h1><p className="mt-2 text-sm text-text-muted">كل دورة محفوظة ويمكن فتحها وتعديلها عند الحاجة.</p></div>
        <Link href="/cycles/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-bold text-bg hover:bg-accent-dim"><CalendarPlus className="h-5 w-5" />دورة جديدة</Link>
      </section>

      <div className="grid gap-3 md:hidden">
        {cycles.map((cycle) => <Card key={cycle.id} className="p-4 shadow-none"><div className="flex items-start justify-between gap-3"><div><p className="number text-lg font-bold">{cycle.weekStart}</p><p className="mt-1 text-xs text-text-muted">تكلفة المولد <span className="number">₪ {formatMoney(cycle.generatorCost)}</span></p></div><Badge variant={cycle.status === "finalized" ? "success" : "warning"}>{cycle.status === "finalized" ? "معتمدة" : "مفتوحة"}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3"><div><p className="text-xs text-text-muted">الاستهلاك</p><p className="number mt-1 font-bold">{formatCups(cycle.totalCups, 2)}</p></div><div><p className="text-xs text-text-muted">المستحق</p><p className="number mt-1 font-bold">₪ {formatMoney(cycle.totalBilled, 0)}</p></div></div><div className="mt-4 flex gap-2"><Link href={`/cycles/${cycle.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-surface-strong px-3 text-sm font-bold"><FileText className="h-4 w-4" />فتح الدورة</Link><CycleDeleteButton cycleId={cycle.id} label={`دورة ${cycle.weekStart}`} /></div></Card>)}
      </div>

      <Card className="hidden p-0 shadow-none md:block"><CardHeader className="p-5"><div><CardTitle>سجل الدورات</CardTitle><CardDescription>افتح أي دورة لإدخال القراءات أو استخراج التقرير.</CardDescription></div></CardHeader><TableWrap className="rounded-none border-x-0 border-b-0"><Table><thead><tr><Th>تاريخ القراءة</Th><Th>التكلفة</Th><Th>الاستهلاك</Th><Th>المستحق</Th><Th>الحالة</Th><Th>إجراء</Th></tr></thead><tbody>{cycles.map((cycle) => <tr key={cycle.id}><Td className="number">{cycle.weekStart}</Td><Td className="number">₪ {formatMoney(cycle.generatorCost)}</Td><Td className="number">{formatCups(cycle.totalCups, 2)}</Td><Td className="number">₪ {formatMoney(cycle.totalBilled, 0)}</Td><Td><Badge variant={cycle.status === "finalized" ? "success" : "warning"}>{cycle.status === "finalized" ? "معتمدة" : "مفتوحة"}</Badge></Td><Td><div className="flex items-center gap-2"><Link href={`/cycles/${cycle.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-bold text-accent hover:bg-accent/10">فتح <ChevronLeft className="h-4 w-4" /></Link><CycleDeleteButton cycleId={cycle.id} label={`دورة ${cycle.weekStart}`} /></div></Td></tr>)}</tbody></Table></TableWrap></Card>
    </div>
  );
}
