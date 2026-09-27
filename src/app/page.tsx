import { ActionLink } from "@/components/ui/action-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterProgress } from "@/components/WaterProgress";
import { getDashboardData } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { ArrowLeft, CalendarPlus, CheckCircle2, ClipboardList, FileText, Gauge, Layers3, WalletCards } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const latest = data.latestDetail;
  const cycle = latest?.cycle ?? data.openCycle;
  const readings = latest?.readings ?? [];
  const totalReadings = readings.length;
  const readCount = readings.filter((reading) => reading.isRead).length;
  const progress = totalReadings ? Math.round((readCount / totalReadings) * 100) : 0;
  const totalDue = readings.reduce((sum, reading) => sum + Number(reading.billedAmount ?? 0), 0);
  const hasOpenCycle = cycle?.status === "open";

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold text-accent">لوحة التشغيل</p>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">إدارة دورة المياه</h1>
          <p className="mt-2 text-sm text-text-muted">إدخال القراءات واعتماد الفاتورة وتنزيل التقرير من مكان واحد.</p>
        </div>
        <Link href="/cycles/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-bold text-bg hover:bg-accent-dim">
          <CalendarPlus className="h-5 w-5" />
          دورة جديدة
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 shadow-none"><div className="flex items-start justify-between"><div><p className="text-sm text-text-muted">الشقق الفعالة</p><p className="number mt-2 text-3xl font-bold">{data.apartmentsCount}</p></div><Layers3 className="h-6 w-6 text-accent" /></div></Card>
        <Card className="p-4 shadow-none"><div className="flex items-start justify-between"><div><p className="text-sm text-text-muted">القراءات المسجلة</p><p className="number mt-2 text-3xl font-bold">{readCount} / {totalReadings}</p></div><ClipboardList className="h-6 w-6 text-success" /></div></Card>
        <Card className="p-4 shadow-none"><div className="flex items-start justify-between"><div><p className="text-sm text-text-muted">إجمالي الاستهلاك</p><p className="number mt-2 text-3xl font-bold">{formatCups(cycle?.totalCups, 2)}</p></div><Gauge className="h-6 w-6 text-warning" /></div></Card>
        <Card className="p-4 shadow-none"><div className="flex items-start justify-between"><div><p className="text-sm text-text-muted">مستحقات آخر دورة</p><p className="number mt-2 text-3xl font-bold">₪ {formatMoney(totalDue, 0)}</p></div><WalletCards className="h-6 w-6 text-accent" /></div></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Card className="p-5 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-text-muted">{hasOpenCycle ? "الدورة الحالية" : "آخر دورة"}</p>
              <h2 className="number mt-1 text-2xl font-bold">{cycle?.weekStart ?? "-"}</h2>
            </div>
            <Badge variant={hasOpenCycle ? "warning" : "success"}>{hasOpenCycle ? "قيد القراءة" : cycle ? "معتمدة" : "لا توجد دورة"}</Badge>
          </div>
          {cycle ? (
            <>
              <div className="mt-6 grid gap-4 border-y border-border py-5 sm:grid-cols-3">
                <div><p className="text-xs text-text-muted">تكلفة المولد</p><p className="number mt-1 text-xl font-bold">₪ {formatMoney(cycle.generatorCost)}</p></div>
                <div><p className="text-xs text-text-muted">سعر الكوب</p><p className="number mt-1 text-xl font-bold">₪ {formatMoney(cycle.exactPricePerCup, 2)}</p></div>
                <div><p className="text-xs text-text-muted">المبلغ المحصل</p><p className="number mt-1 text-xl font-bold">₪ {formatMoney(cycle.totalBilled, 0)}</p></div>
              </div>
              <div className="mt-5"><WaterProgress value={progress} label={`تمت قراءة ${readCount} من ${totalReadings} شقة`} /></div>
            </>
          ) : <p className="mt-8 text-sm text-text-muted">أنشئ دورة جديدة للبدء.</p>}
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <ActionLink href={hasOpenCycle && cycle ? `/cycles/${cycle.id}/readings` : "/cycles/new"} label={hasOpenCycle ? "إدخال القراءات" : "إنشاء دورة"} icon={hasOpenCycle ? ClipboardList : CalendarPlus} variant="primary" />
            <ActionLink href={cycle ? `/cycles/${cycle.id}/report` : "#"} label="تنزيل التقرير" icon={FileText} disabled={!cycle || hasOpenCycle} />
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <h2 className="text-lg font-bold">خطوات الدورة</h2>
          <ol className="mt-5 space-y-4">
            <li className="flex gap-3"><span className="number flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-sm font-bold text-accent">1</span><div><p className="font-bold">إنشاء الدورة</p><p className="text-sm text-text-muted">التاريخ والتكلفة فقط.</p></div></li>
            <li className="flex gap-3"><span className="number flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-sm font-bold text-accent">2</span><div><p className="font-bold">حفظ القراءات</p><p className="text-sm text-text-muted">على الجهاز أو عبر الإنترنت.</p></div></li>
            <li className="flex gap-3"><span className="number flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-success/15 text-sm font-bold text-success">3</span><div><p className="font-bold">اعتماد وتنزيل</p><p className="text-sm text-text-muted">تُحسب الفاتورة ويصبح التقرير جاهزاً.</p></div></li>
          </ol>
        </Card>
      </section>

      <section className="border-t border-border pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-bold">آخر الدورات</h2><p className="mt-1 text-sm text-text-muted">الأرشيف محفوظ ويمكن فتح أي دورة وتعديلها.</p></div>
          <Link href="/cycles" className="inline-flex items-center gap-1 text-sm font-bold text-accent">كل الدورات <ArrowLeft className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-2">
          {data.cycles.map((item) => (
            <Link key={item.id} href={`/cycles/${item.id}`} className="grid min-h-16 grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border/70 px-1 py-3 transition hover:bg-surface">
              <div><p className="number font-bold">{item.weekStart}</p><p className="text-xs text-text-muted">{item.status === "finalized" ? "دورة معتمدة" : "دورة مفتوحة"}</p></div>
              <p className="number text-sm font-bold">₪ {formatMoney(item.totalBilled, 0)}</p>
              <CheckCircle2 className={item.status === "finalized" ? "h-5 w-5 text-success" : "h-5 w-5 text-warning"} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
