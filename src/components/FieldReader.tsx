"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WaterProgress } from "@/components/WaterProgress";
import { formatCups } from "@/lib/format";
import { offlineDb, type OfflineCycleDraft, type OfflineReading } from "@/lib/offline/dexie";
import { markReading, saveCycleDraft, saveFieldPayload, syncPendingReadings } from "@/lib/offline/sync";
import { useAppStore } from "@/store/useAppStore";
import { CheckCircle2, Cloud, CloudOff, Copy, Download, FileText, RefreshCw, Save, Search, ShieldCheck, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function readingStatus(reading: OfflineReading) {
  if (reading.syncStatus === "error") return { label: "يحتاج مزامنة", variant: "danger" as const };
  if (reading.syncStatus === "pending") return { label: "محفوظ محلياً", variant: "warning" as const };
  if (reading.isRead) return { label: "متزامن", variant: "success" as const };
  return { label: "بانتظار القراءة", variant: "muted" as const };
}

function draftStatus(draft: OfflineCycleDraft | null, pending: number) {
  if (!draft) return "لم تحفظ أي قراءة محلياً بعد";
  if (draft.status === "error") return "النسخة المحلية محفوظة وتنتظر إعادة المزامنة";
  if (pending > 0) return `محفوظ على الجهاز - ${pending} بانتظار المزامنة`;
  return "محفوظ ومتزامن";
}

export function FieldReader() {
  const { isOnline, setCurrentCycleId, setIsOnline, pendingSyncCount, setPendingSyncCount } = useAppStore();
  const [readings, setReadings] = useState<OfflineReading[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [previousValues, setPreviousValues] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState<OfflineCycleDraft | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileUrl, setMobileUrl] = useState<string>("");
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const loadLocal = useCallback(async () => {
    const localReadings = await offlineDb.readings.orderBy("apartmentId").toArray();
    const cycleId = localReadings[0]?.cycleId ?? null;
    setReadings(localReadings);
    setCurrentCycleId(cycleId);
    setValues(Object.fromEntries(localReadings.map((reading) => [reading.id!, String(reading.currentReading ?? "")] )));
    setPreviousValues(Object.fromEntries(localReadings.map((reading) => [reading.id!, String(reading.previousReading ?? "")] )));
    setNotes(Object.fromEntries(localReadings.map((reading) => [reading.id!, reading.notes ?? ""])));
    setPendingSyncCount(localReadings.filter((reading) => reading.syncStatus === "pending" || reading.syncStatus === "error").length);
    setDraft(cycleId ? (await offlineDb.cycleDrafts.get(cycleId)) ?? null : null);
  }, [setCurrentCycleId, setPendingSyncCount]);

  const refreshFieldData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      if (!silent) setMessage(null);

      try {
        const response = await fetch("/api/field", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          const hasUnsynced = (await offlineDb.readings.toArray()).some(
            (reading) => reading.syncStatus === "pending" || reading.syncStatus === "error"
          );
          if (response.status === 404 && !hasUnsynced) {
            await saveFieldPayload([]);
            await loadLocal();
            if (!silent) setMessage(data.error ?? "لا توجد دورة مفتوحة");
            return;
          }
          throw new Error(data.error ?? "تعذر تحديث قائمة الشقق");
        }
        await saveFieldPayload(data.readings);
        await loadLocal();
        if (!silent) setMessage("تم تحديث بيانات الدورة بدون تغيير النسخة المحفوظة على الجهاز");
      } catch (caught) {
        if (!silent) setError(caught instanceof Error ? caught.message : "حدث خطأ غير متوقع");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [loadLocal]
  );

  useEffect(() => {
    void loadLocal();
    fetch("/api/network-url")
      .then((response) => response.json())
      .then((data) => setMobileUrl(data.fieldUrl ?? `${window.location.origin}/field`))
      .catch(() => setMobileUrl(`${window.location.origin}/field`));

    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    if (navigator.onLine) void refreshFieldData(true);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [loadLocal, refreshFieldData, setIsOnline]);

  const progress = useMemo(() => {
    const read = readings.filter((reading) => reading.isRead).length;
    return { read, total: readings.length, percent: readings.length ? Math.round((read / readings.length) * 100) : 0 };
  }, [readings]);

  const activeCycleId = readings[0]?.cycleId ?? null;
  const canApprove = Boolean(activeCycleId && progress.total > 0 && progress.read === progress.total);
  const filteredReadings = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return readings;
    return readings.filter(
      (reading) =>
        reading.apartmentNumber.toLowerCase().includes(term) ||
        (reading.ownerName ?? "").toLowerCase().includes(term) ||
        String(reading.floor ?? "").includes(term)
    );
  }, [query, readings]);

  function markDirty(id: number) {
    setDirtyIds((current) => new Set(current).add(id));
  }

  async function persistReading(reading: OfflineReading) {
    const previousValue = Number(previousValues[reading.id!] ?? "");
    const currentValue = Number(values[reading.id!] ?? "");
    if (!Number.isFinite(previousValue)) throw new Error(`أدخل القراءة السابقة للشقة ${reading.apartmentNumber}`);
    if (!Number.isFinite(currentValue)) throw new Error(`أدخل القراءة الحالية للشقة ${reading.apartmentNumber}`);
    await markReading(reading, currentValue, notes[reading.id!] ?? null, previousValue);
  }

  async function saveCycleOnDevice(silent = false) {
    if (!activeCycleId) throw new Error("لا توجد دورة مفتوحة للحفظ");
    const changed = readings.filter((reading) => dirtyIds.has(reading.id!));
    for (const reading of changed) await persistReading(reading);
    await saveCycleDraft(activeCycleId, changed.length ? "pending" : undefined);
    setDirtyIds(new Set());
    await loadLocal();
    if (!silent) setMessage(changed.length ? `تم حفظ ${changed.length} قراءة على الجهاز` : "الدورة محفوظة على الجهاز");
  }

  async function saveReading(reading: OfflineReading) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await persistReading(reading);
      setDirtyIds((current) => {
        const next = new Set(current);
        next.delete(reading.id!);
        return next;
      });
      if (isOnline) {
        try {
          await syncPendingReadings();
          setMessage("تم حفظ القراءة ومزامنتها");
        } catch {
          setMessage("تم حفظ القراءة على الجهاز، وستتم مزامنتها عند توفر اتصال ثابت");
        }
      } else {
        setMessage("تم حفظ القراءة على الجهاز");
      }
      await loadLocal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر حفظ القراءة");
    } finally {
      setLoading(false);
    }
  }

  async function syncCycle() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!isOnline) throw new Error("اتصل بالإنترنت للمزامنة. النسخة المحلية محفوظة بالفعل.");
      await saveCycleOnDevice(true);
      const result = await syncPendingReadings();
      if (result.pendingCycles[0]?.unreadCount) {
        setMessage(`تمت المزامنة. المتبقي ${result.pendingCycles[0].unreadCount} شقق`);
      } else if (result.readyCycles[0]) {
        setMessage("تمت مزامنة كل القراءات والدورة جاهزة للاعتماد");
      } else {
        setMessage(result.synced ? `تمت مزامنة ${result.synced} قراءة` : "كل القراءات متزامنة");
      }
      await loadLocal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذرت المزامنة");
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf(cycleId: number, weekStart?: string) {
    const pdfUrl = `/api/pdf/${cycleId}?download=1`;
    const response = await fetch(pdfUrl);
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("application/pdf")) {
      throw new Error("تعذر تنزيل ملف PDF");
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `water-cycle-${cycleId}${weekStart ? `-${weekStart}` : ""}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function approveCycle() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!isOnline) throw new Error("اعتماد الدورة يحتاج اتصالاً بالإنترنت. احفظها على الجهاز أولاً.");
      if (!activeCycleId) throw new Error("لا توجد دورة مفتوحة للاعتماد");
      await saveCycleOnDevice(true);
      const localReadings = await offlineDb.readings.where("cycleId").equals(activeCycleId).toArray();
      const unreadCount = localReadings.filter((reading) => !reading.isRead).length;
      if (unreadCount > 0) throw new Error(`المتبقي ${unreadCount} شقق قبل الاعتماد`);
      await syncPendingReadings();

      const response = await fetch(`/api/cycles/${activeCycleId}/finalize`, { method: "PUT" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر اعتماد الدورة");

      await saveCycleDraft(activeCycleId, "synced");
      await loadLocal();
      setReportUrl(`/api/pdf/${data.cycle.id}?download=1`);
      setMessage("تم اعتماد الدورة وحساب الفواتير. التقرير جاهز للتنزيل.");
      await downloadPdf(data.cycle.id, data.cycle.weekStart);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر اعتماد الدورة");
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }

  async function copyMobileLink() {
    const link = mobileUrl || `${window.location.origin}/field`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage("تم نسخ رابط القارئ الميداني");
    } catch {
      setError(link);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <Card className="overflow-hidden border-accent/25 bg-surface">
        <CardHeader className="mb-5 border-b border-border/70 pb-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-accent"><Smartphone className="h-5 w-5" /><span className="text-xs font-bold">القارئ الميداني</span></div>
            <CardTitle className="text-xl sm:text-2xl">قراءات دورة واحدة، محفوظة دائماً</CardTitle>
            <CardDescription>احفظ العمل على الجهاز أولاً، ثم زامنه واعتمده عند توفر اتصال.</CardDescription>
          </div>
          <Badge variant={isOnline ? "success" : "warning"}>{isOnline ? <Cloud className="ml-1 h-3.5 w-3.5" /> : <CloudOff className="ml-1 h-3.5 w-3.5" />}{isOnline ? "متصل" : "دون اتصال"}</Badge>
        </CardHeader>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button type="button" variant="secondary" className="min-h-14" onClick={() => refreshFieldData(false)} disabled={loading || !isOnline}>
            <RefreshCw className="h-5 w-5" />تحديث الشقق
          </Button>
          <Button type="button" variant="secondary" className="min-h-14" onClick={() => void saveCycleOnDevice()} disabled={loading || !activeCycleId}>
            <Save className="h-5 w-5" />حفظ على الجهاز
          </Button>
          <Button type="button" className="min-h-14" onClick={syncCycle} disabled={loading || !isOnline || !activeCycleId}>
            <RefreshCw className="h-5 w-5" />مزامنة {pendingSyncCount ? `(${pendingSyncCount})` : ""}
          </Button>
          <Button type="button" className="min-h-14 bg-success text-bg hover:bg-success/85" onClick={approveCycle} disabled={loading || !isOnline || !canApprove}>
            <ShieldCheck className="h-5 w-5" />اعتماد وإصدار الفاتورة
          </Button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-bg/60 px-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent"><CheckCircle2 className="h-5 w-5" /></span>
            <div className="min-w-0"><p className="text-xs text-text-muted">حالة الحفظ</p><p className="truncate text-sm font-semibold text-text-primary">{draftStatus(draft, pendingSyncCount)}</p></div>
          </div>
          <Button type="button" variant="ghost" className="min-h-14" onClick={copyMobileLink}><Copy className="h-5 w-5" />نسخ الرابط</Button>
        </div>

        <div className="mt-5"><WaterProgress value={progress.percent} label={`تمت قراءة ${progress.read} من ${progress.total} شقة`} /></div>
        {reportUrl ? <a href={reportUrl} download className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-accent bg-accent/10 px-4 text-sm font-semibold text-accent"><FileText className="h-5 w-5" />تنزيل تقرير PDF</a> : null}
        {message ? <p className="mt-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      </Card>

      <div className="sticky top-[76px] z-30 border border-border/80 bg-bg/95 p-2 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الشقة أو الاسم" className="min-h-12 pr-10 text-base" /></label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredReadings.map((reading) => {
          const previous = Number(previousValues[reading.id!] ?? reading.previousReading);
          const current = Number(values[reading.id!] ?? previous);
          const consumption = Number.isFinite(current) && Number.isFinite(previous) ? Math.max(0, current - previous) : 0;
          const status = readingStatus(reading);
          return (
            <Card key={reading.id} className="flex flex-col gap-4 border-border bg-surface p-4 shadow-none transition hover:border-accent/40">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold text-text-muted">شقة</p><h2 className="number mt-1 text-3xl font-bold text-text-primary">{reading.apartmentNumber}</h2><p className="mt-2 text-sm font-bold">{reading.ownerName ?? "-"}</p><p className="text-xs text-text-muted">الطابق {reading.floor ?? "-"}</p></div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-text-muted">القراءة السابقة<Input inputMode="decimal" className="number mt-1 min-h-12 text-base" value={previousValues[reading.id!] ?? ""} onChange={(event) => { setPreviousValues((items) => ({ ...items, [reading.id!]: event.target.value })); markDirty(reading.id!); }} /></label>
                <label className="text-xs font-semibold text-text-muted">القراءة الحالية<Input inputMode="decimal" className="number mt-1 min-h-12 text-base" value={values[reading.id!] ?? ""} onChange={(event) => { setValues((items) => ({ ...items, [reading.id!]: event.target.value })); markDirty(reading.id!); }} /></label>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2"><label className="text-xs font-semibold text-text-muted">ملاحظات<Input className="mt-1 min-h-11" value={notes[reading.id!] ?? ""} onChange={(event) => { setNotes((items) => ({ ...items, [reading.id!]: event.target.value })); markDirty(reading.id!); }} /></label><div className="self-end rounded-md border border-border bg-bg/60 px-3 py-2"><p className="text-xs text-text-muted">الاستهلاك</p><p className="number mt-1 text-lg font-bold text-accent">{formatCups(consumption, 2)}</p></div></div>
              <Button type="button" variant="secondary" className="w-full" onClick={() => saveReading(reading)} disabled={loading}><Save className="h-4 w-4" />حفظ القراءة</Button>
            </Card>
          );
        })}
      </div>
      {!filteredReadings.length ? <Card className="p-6 text-center text-sm text-text-muted">{query.trim() ? "لا توجد شقق مطابقة للبحث" : "لا توجد دورة مفتوحة للقراءة الآن"}</Card> : null}
    </div>
  );
}
