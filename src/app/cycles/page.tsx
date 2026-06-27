import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { getCycles } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CyclesPage() {
  const cycles = await getCycles();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-surface/70 p-4 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">دورات الفوترة</h1>
          <p className="mt-1 text-sm text-text-muted">سجل دورات القراءة وحالتها.</p>
        </div>
        <Link
          href="/cycles/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg shadow-sm hover:bg-accent-dim"
        >
          <CalendarPlus className="h-4 w-4" />
          دورة جديدة
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>الأرشيف</CardTitle>
            <CardDescription>افتح أي دورة لإدخال القراءات أو استخراج التقرير.</CardDescription>
          </div>
        </CardHeader>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>تاريخ القراءة</Th>
                <Th>تكلفة المولد</Th>
                <Th>إجمالي الأكواب</Th>
                <Th>المستحق</Th>
                <Th>تغطية المبلغ</Th>
                <Th>الحالة</Th>
                <Th>إجراء</Th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => {
                const totalDiscrepancy = Number(cycle.totalDiscrepancy ?? 0);
                const coverage =
                  totalDiscrepancy <= 0
                    ? "مغطى بالكامل"
                    : `غير مغطى ₪ ${formatMoney(totalDiscrepancy, 3)}`;

                return (
                  <tr key={cycle.id}>
                    <Td className="number">{cycle.weekStart}</Td>
                    <Td className="number">₪ {formatMoney(cycle.generatorCost)}</Td>
                    <Td className="number">{formatCups(cycle.totalCups, 2)}</Td>
                    <Td className="number">₪ {formatMoney(cycle.totalBilled)}</Td>
                    <Td className="number">{coverage}</Td>
                    <Td>
                      <Badge variant={cycle.status === "finalized" ? "success" : "warning"}>
                        {cycle.status === "finalized" ? "مغلقة" : "مفتوحة"}
                      </Badge>
                    </Td>
                    <Td>
                      <Link
                        href={`/cycles/${cycle.id}`}
                        className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface-strong/80 px-3 py-2 text-xs font-semibold hover:border-accent/60"
                      >
                        فتح
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
