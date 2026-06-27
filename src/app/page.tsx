import { Badge } from "@/components/ui/badge";
import { ActionLink } from "@/components/ui/action-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { WaterProgress } from "@/components/WaterProgress";
import { getDashboardData } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { CalendarPlus, ClipboardList, FileText, Gauge } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const latest = data.latestDetail;
  const cycle = latest?.cycle ?? data.openCycle;
  const totalReadings = latest?.readings.length ?? 0;
  const readCount = latest?.readings.filter((reading) => reading.isRead).length ?? 0;
  const progress = totalReadings ? Math.round((readCount / totalReadings) * 100) : 0;
  const totalDue = latest?.readings.reduce((sum, reading) => sum + Number(reading.billedAmount ?? 0), 0) ?? 0;
  const surplus = Math.max(0, -Number(cycle?.totalDiscrepancy ?? 0));
  const cumulativeCoverage =
    data.coverageBalance === 0
      ? "متوازن"
      : data.coverageBalance > 0
        ? `فائض ₪ ${formatMoney(data.coverageBalance, 3)}`
        : `عجز ₪ ${formatMoney(Math.abs(data.coverageBalance), 3)}`;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="min-h-64 overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl sm:text-3xl">لوحة إدارة المياه</CardTitle>
              <CardDescription>متابعة الدورة المفتوحة وقراءات الشقق وتحصيل المستحقات الدورية.</CardDescription>
            </div>
            <Badge variant={cycle?.status === "finalized" ? "success" : "warning"}>
              {cycle ? (cycle.status === "finalized" ? "آخر دورة مغلقة" : "دورة مفتوحة") : "لا توجد دورة"}
            </Badge>
          </CardHeader>
          {cycle ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="تاريخ القراءة" value={cycle.weekStart} valueClassName="text-lg" />
              <MetricCard label="تكلفة المولد" value={`₪ ${formatMoney(cycle.generatorCost)}`} valueClassName="text-2xl text-accent" />
              <MetricCard label="مستحقات الدورة" value={`₪ ${formatMoney(totalDue)}`} valueClassName="text-2xl text-success" />
              <MetricCard label="الفائض" value={`₪ ${formatMoney(surplus, 3)}`} valueClassName="text-2xl text-accent" />
              <MetricCard
                label="الرصيد التراكمي"
                value={cumulativeCoverage}
                valueClassName={data.coverageBalance >= 0 ? "text-2xl text-success" : "text-2xl text-warning"}
              />
            </div>
          ) : (
            <p className="text-text-muted">ابدأ بإنشاء دورة جديدة لإظهار الإحصاءات.</p>
          )}
          <div className="mt-6">
            <WaterProgress value={progress} label={`تمت قراءة ${readCount} من ${totalReadings} شقة`} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>إجراءات سريعة</CardTitle>
              <CardDescription>اختصارات العمل اليومي.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3">
            <ActionLink href="/cycles/new" label="دورة جديدة" icon={CalendarPlus} variant="primary" />
            <ActionLink href="/field" label="فتح القارئ الميداني" icon={ClipboardList} />
            <ActionLink href={cycle ? `/cycles/${cycle.id}/report` : "#"} label="تقرير PDF" icon={FileText} disabled={!cycle} />
          </div>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["الشقق الفعالة", data.apartmentsCount],
          ["الشقق المقروءة", readCount],
          ["إجمالي الأكواب", formatCups(cycle?.totalCups, 2)],
          ["سعر الكوب", cycle?.exactPricePerCup ? `₪ ${formatMoney(cycle.exactPricePerCup, 4)}` : "بانتظار الإغلاق"]
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <MetricCard label={label} value={value} icon={Gauge} className="border-0 bg-transparent p-0" valueClassName="text-2xl" />
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>آخر الدورات</CardTitle>
            <CardDescription>ملخص آخر أربع دورات فوترة.</CardDescription>
          </div>
        </CardHeader>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>تاريخ القراءة</Th>
                <Th>التكلفة</Th>
                <Th>المقروء</Th>
                <Th>المستحق</Th>
                <Th>الحالة</Th>
                <Th>فتح</Th>
              </tr>
            </thead>
            <tbody>
              {data.cycles.map((item) => (
                <tr key={item.id}>
                  <Td className="number">{item.weekStart}</Td>
                  <Td className="number">₪ {formatMoney(item.generatorCost)}</Td>
                  <Td className="number">{item.readCount ?? 0} / {item.readingsCount ?? 0}</Td>
                  <Td className="number">₪ {formatMoney(item.totalBilled)}</Td>
                  <Td>
                    <Badge variant={item.status === "finalized" ? "success" : "warning"}>
                      {item.status === "finalized" ? "مغلقة" : "مفتوحة"}
                    </Badge>
                  </Td>
                  <Td>
                    <Link className="text-accent hover:underline" href={`/cycles/${item.id}`}>
                      التفاصيل
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
