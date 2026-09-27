"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CycleRow, ReadingRow } from "@/lib/db/queries";
import { formatCups } from "@/lib/format";
import { Check, History, RefreshCw, Save, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function ReadingsEditor({ cycle, readings }: { cycle: CycleRow; readings: ReadingRow[] }) {
  const router = useRouter();
  const [values, setValues] = useState(() => Object.fromEntries(readings.map((reading) => [reading.id, String(reading.currentReading)])));
  const [previousValues, setPreviousValues] = useState(() => Object.fromEntries(readings.map((reading) => [reading.id, String(reading.previousReading)])));
  const [notes, setNotes] = useState(() => Object.fromEntries(readings.map((reading) => [reading.id, reading.notes ?? ""])));
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const isFinalized = cycle.status === "finalized";

  const progress = useMemo(() => ({ read: readings.filter((reading) => reading.isRead).length, total: readings.length }), [readings]);
  const shownReadings = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return readings;
    return readings.filter((reading) => reading.apartmentNumber.includes(term) || (reading.ownerName ?? "").toLowerCase().includes(term));
  }, [query, readings]);

  async function save(reading: ReadingRow) {
    setSavingId(reading.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/readings/${reading.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousReading: previousValues[reading.id], currentReading: values[reading.id], notes: notes[reading.id] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر حفظ القراءة");
      setMessage(isFinalized ? "تم حفظ التعديل وإعادة حساب الدورة والدورات التالية" : "تم حفظ القراءة");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر حفظ القراءة");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-accent/25 bg-surface p-4 shadow-none">
        <CardHeader className="mb-4 border-b border-border/70 pb-4"><div><div className="mb-2 flex items-center gap-2 text-accent"><History className="h-5 w-5" /><span className="text-xs font-bold">القراءات</span></div><CardTitle>إدخال ومراجعة القراءات</CardTitle><CardDescription>تمت قراءة {progress.read} من {progress.total} شقة.</CardDescription></div>{isFinalized ? <Badge variant="warning"><RefreshCw className="ml-1 h-3.5 w-3.5" />التعديل يعيد الحساب</Badge> : <Badge variant="success">دورة مفتوحة</Badge>}</CardHeader>
        {isFinalized ? <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm leading-6 text-warning">يمكن تعديل القراءة السابقة عند تغيير العداد. سيعاد حساب هذه الدورة وكل الدورات اللاحقة مع بقاء سجلها محفوظاً.</p> : null}
        {message ? <p className="mt-3 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</p> : null}
        {error ? <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      </Card>

      <label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الشقة أو الاسم" className="min-h-12 pr-10" /></label>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shownReadings.map((reading) => {
          const previous = Number(previousValues[reading.id] || reading.previousReading);
          const current = Number(values[reading.id] || previous);
          const preview = Math.max(0, current - previous);
          const saving = savingId === reading.id;
          return <Card key={reading.id} className="p-4 shadow-none"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-text-muted">شقة</p><h2 className="number mt-1 text-2xl font-bold">{reading.apartmentNumber}</h2><p className="mt-2 text-sm font-bold">{reading.ownerName ?? "-"}</p></div><Badge variant={reading.isRead ? "success" : "warning"}>{reading.isRead ? "مقروءة" : "بانتظار"}</Badge></div><div className="mt-4 grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-text-muted">القراءة السابقة<Input disabled={saving} inputMode="decimal" className="number mt-1 min-h-12" value={previousValues[reading.id]} onChange={(event) => setPreviousValues((items) => ({ ...items, [reading.id]: event.target.value }))} /></label><label className="text-xs font-semibold text-text-muted">القراءة الحالية<Input disabled={saving} inputMode="decimal" className="number mt-1 min-h-12" value={values[reading.id]} onChange={(event) => setValues((items) => ({ ...items, [reading.id]: event.target.value }))} /></label></div><div className="mt-2 grid grid-cols-[1fr_auto] gap-2"><label className="text-xs font-semibold text-text-muted">ملاحظات<Input disabled={saving} className="mt-1 min-h-11" value={notes[reading.id]} onChange={(event) => setNotes((items) => ({ ...items, [reading.id]: event.target.value }))} /></label><div className="self-end rounded-md bg-bg px-3 py-2"><p className="text-xs text-text-muted">الاستهلاك</p><p className="number mt-1 text-lg font-bold text-accent">{formatCups(preview, 2)}</p></div></div><Button type="button" variant="secondary" className="mt-4 w-full" disabled={saving} onClick={() => void save(reading)}>{reading.isRead ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saving ? "جاري الحفظ" : "حفظ القراءة"}</Button></Card>;
        })}
      </div>
      {!shownReadings.length ? <Card className="p-6 text-center text-sm text-text-muted">لا توجد شقق مطابقة للبحث.</Card> : null}
    </div>
  );
}
