import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { WaterProgress } from "@/components/WaterProgress";
import { getCycleDetail } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { ArrowLeft, ClipboardList, FileText, ReceiptText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CycleDetailPage({ params }: { params: { id: string } }) {
  const detail = await getCycleDetail(Number(params.id));
  if (!detail) notFound();

  const readCount = detail.readings.filter((reading) => reading.isRead).length;
  const progress = detail.readings.length ? Math.round((readCount / detail.readings.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>دورة {detail.cycle.weekStart}</CardTitle>
            <CardDescription>تاريخ القراءة {detail.cycle.weekStart}</CardDescription>
          </div>
          <Badge variant={detail.cycle.status === "finalized" ? "success" : "warning"}>
            {detail.cycle.status === "finalized" ? "مغلقة" : "مفتوحة"}
          </Badge>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="تكلفة المولد" value={`₪ ${formatMoney(detail.cycle.generatorCost)}`} />
          <MetricCard label="إجمالي الأكواب" value={formatCups(detail.cycle.totalCups, 2)} />
          <MetricCard label="سعر الكوب" value={`₪ ${formatMoney(detail.cycle.exactPricePerCup, 4)}`} />
          <MetricCard label="المستحق" value={`₪ ${formatMoney(detail.cycle.totalBilled)}`} />
          <MetricCard
            label="تغطية المبلغ"
            value={
              Number(detail.cycle.totalDiscrepancy ?? 0) === 0
                ? "مغطى بالكامل"
                : `فرق ₪ ${formatMoney(Math.abs(Number(detail.cycle.totalDiscrepancy ?? 0)), 3)}`
            }
            valueClassName="text-success"
          />
        </div>
        <p className="mt-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm leading-6 text-success">
          يتم توزيع فرق التقريب على الشقق ذات أكبر كسور حتى يغطي إجمالي المستحق تكلفة المولد كاملة.
        </p>
        <div className="mt-5">
          <WaterProgress value={progress} label={`تمت قراءة ${readCount} من ${detail.readings.length} شقة`} />
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          [`/cycles/${detail.cycle.id}/readings`, "إدخال القراءات", ClipboardList],
          [`/cycles/${detail.cycle.id}/billing`, "مراجعة الفوترة", ReceiptText],
          [`/cycles/${detail.cycle.id}/report`, "تقرير PDF", FileText]
        ].map(([href, label, Icon]) => (
          <Link
            key={String(href)}
            href={String(href)}
            className="flex min-h-20 items-center justify-between rounded-lg border border-border bg-surface/80 p-4 shadow-sm transition hover:border-accent/60 hover:bg-surface-strong/70"
          >
            <span className="inline-flex items-center gap-3 font-semibold">
              <Icon className="h-5 w-5 text-accent" />
              {String(label)}
            </span>
            <ArrowLeft className="h-4 w-4 text-text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
