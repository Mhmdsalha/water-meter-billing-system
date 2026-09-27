import { ActionLink } from "@/components/ui/action-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterProgress } from "@/components/WaterProgress";
import { getDashboardData } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { ArrowLeft, CalendarDays, CalendarPlus, ChevronLeft, ClipboardList, FileText, Gauge, Layers3, WalletCards } from "lucide-react";
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

      <section>
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
      </section>

      <section className="border-t border-border pt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent"><CalendarDays className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-bold">آخر الدورات</h2><p className="mt-1 text-sm text-text-muted">الأرشيف محفوظ والتفاصيل متاحة في أي وقت.</p></div>
          </div>
          <Link href="/cycles" className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-accent">كل الدورات <ArrowLeft className="h-4 w-4" /></Link>
        </div>
        <Card className="overflow-hidden p-0 shadow-none">
          {data.cycles.length === 0 ? <p className="p-6 text-center text-sm text-text-muted">لا توجد دورات مسجلة بعد.</p> : data.cycles.map((item) => (
            <Link key={item.id} href={`/cycles/${item.id}`} className="group grid gap-4 border-b border-border/70 px-4 py-4 transition last:border-0 hover:bg-surface-strong/60 sm:grid-cols-[1.3fr_auto_auto_auto] sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <span className="number flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-bg text-sm font-bold text-text-primary">{item.id}</span>
                <div><p className="text-xs text-text-muted">رقم الدورة</p><p className="number mt-1 text-base font-bold">{item.weekStart}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-5 border-y border-border/70 py-3 sm:contents sm:border-0 sm:p-0">
                <div><p className="text-xs text-text-muted">التكلفة</p><p className="number mt-1 font-bold">₪ {formatMoney(item.generatorCost, 0)}</p></div>
                <div><p className="text-xs text-text-muted">الاستهلاك</p><p className="number mt-1 font-bold">{formatCups(item.totalCups, 2)}</p></div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <Badge variant={item.status === "finalized" ? "success" : "warning"}>{item.status === "finalized" ? "معتمدة" : "مفتوحة"}</Badge>
                <ChevronLeft className="h-5 w-5 text-text-muted transition group-hover:-translate-x-1 group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </Card>
      </section>
    </div>
  );
}
