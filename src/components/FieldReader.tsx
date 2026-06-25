"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WaterProgress } from "@/components/WaterProgress";
import { formatCups } from "@/lib/format";
import { offlineDb, type OfflineReading } from "@/lib/offline/dexie";
import { markReading, saveFieldPayload, syncPendingReadings } from "@/lib/offline/sync";
import { useAppStore } from "@/store/useAppStore";
import { CheckCircle, Copy, Download, FileText, RefreshCw, Save, Search, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function readingStatus(reading: OfflineReading) {
  if (reading.syncStatus === "pending") return { label: "بانتظار المزامنة", variant: "warning" as const };
  if (reading.syncStatus === "error") return { label: "خطأ", variant: "danger" as const };
  if (reading.isRead) return { label: "مقروءة", variant: "success" as const };
  return { label: "بانتظار", variant: "muted" as const };
}

export function FieldReader() {
  const { isOnline, setIsOnline, pendingSyncCount, setPendingSyncCount } = useAppStore();
  const [readings, setReadings] = useState<OfflineReading[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [previousValues, setPreviousValues] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileUrl, setMobileUrl] = useState<string>("");
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const loadLocal = useCallback(async () => {
    const localReadings = await offlineDb.readings.orderBy("apartmentId").toArray();
    setReadings(localReadings);
    setValues(Object.fromEntries(localReadings.map((reading) => [reading.id!, String(reading.currentReading ?? "")])));
    setPreviousValues(Object.fromEntries(localReadings.map((reading) => [reading.id!, String(reading.previousReading ?? "")])));
    setNotes(Object.fromEntries(localReadings.map((reading) => [reading.id!, reading.notes ?? ""])));
    setPendingSyncCount(localReadings.filter((reading) => reading.syncStatus === "pending" || reading.syncStatus === "error").length);
  }, [setPendingSyncCount]);

  const refreshFieldData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      if (!silent) setMessage(null);

      try {
        const response = await fetch("/api/field");
        const data = await response.json();
        if (!response.ok) {
          const localReadings = await offlineDb.readings.toArray();
          const hasUnsynced = localReadings.some((reading) => reading.syncStatus === "pending" || reading.syncStatus === "error");
          if (response.status === 404 && !hasUnsynced) {
            await saveFieldPayload([]);
            await loadLocal();
            if (!silent) setMessage(data.error ?? "لا توجد دورة مفتوحة");
            return;
          }
          throw new Error(data.error ?? "تعذر تحديث قائمة الشقق");
        }
        await saveFieldPayload(data.readings);
        if (!silent) setMessage("تم تحديث قائمة الشقق");
        await loadLocal();
      } catch (caught) {
        if (!silent) {
          setError(caught instanceof Error ? caught.message : "حدث خطأ غير متوقع");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [loadLocal]
  );

  useEffect(() => {
    loadLocal();
    fetch("/api/network-url")
      .then((response) => response.json())
      .then((data) => setMobileUrl(data.fieldUrl ?? `${window.location.origin}/field`))
      .catch(() => setMobileUrl(`${window.location.origin}/field`));

    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    if (navigator.onLine) {
      void refreshFieldData(true);
    }
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [loadLocal, refreshFieldData, setIsOnline]);

  useEffect(() => {
    if (isOnline) {
      void refreshFieldData(true);
    }
  }, [isOnline, refreshFieldData]);

  const progress = useMemo(() => {
    const read = readings.filter((reading) => reading.isRead).length;
    return {
      read,
      total: readings.length,
      percent: readings.length ? Math.round((read / readings.length) * 100) : 0
    };
  }, [readings]);

  const activeCycleId = readings[0]?.cycleId ?? null;
  const canApprove = Boolean(activeCycleId && progress.total > 0 && progress.read === progress.total);

  const filteredReadings = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return readings;
    return readings.filter((reading) => {
      return (
        reading.apartmentNumber.toLowerCase().includes(term) ||
        (reading.ownerName ?? "").toLowerCase().includes(term) ||
        String(reading.floor ?? "").includes(term)
      );
    });
  }, [query, readings]);

  async function save(reading: OfflineReading) {
    setError(null);
    try {
      const previousValue = reading.canEditPrevious ? Number(previousValues[reading.id!] ?? "") : reading.previousReading;
      const currentValue = Number(values[reading.id!] ?? "");

      if (!Number.isFinite(previousValue)) throw new Error("أدخل القراءة السابقة بشكل صحيح");
      if (!Number.isFinite(currentValue)) throw new Error("أدخل القراءة الحالية بشكل صحيح");

      await markReading(reading, currentValue, notes[reading.id!] ?? null, previousValue);
      await loadLocal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "حدث خطأ غير متوقع");
    }
  }

  async function sync() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await refreshFieldData(true);
      const result = await syncPendingReadings();
      const finalized = result.finalizedCycles[0];
      if (finalized) {
        setReportUrl(`${finalized.pdfUrl}?download=1`);
        setMessage(`تمت مزامنة ${result.synced} قراءة، والدورة معتمدة سابقا`);
      } else if (result.pendingCycles[0]?.unreadCount) {
        setReportUrl(null);
        setMessage(`تمت مزامنة ${result.synced} قراءة، والمتبقي ${result.pendingCycles[0].unreadCount} شقق قبل تجهيز الفوترة`);
      } else if (result.readyCycles[0]) {
        setReportUrl(null);
        setMessage(`تمت مزامنة ${result.synced} قراءة، والدورة جاهزة للاعتماد`);
      } else {
        setReportUrl(null);
        setMessage(`تمت مزامنة ${result.synced} قراءة`);
      }
      await loadLocal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "حدث خطأ غير متوقع");
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf(cycleId: number, weekStart?: string) {
    const pdfUrl = `/api/pdf/${cycleId}?download=1`;
    setReportUrl(pdfUrl);
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `water-cycle-${cycleId}${weekStart ? `-${weekStart}` : ""}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function approveCycle() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!isOnline) throw new Error("يجب الاتصال بالإنترنت لاعتماد الدورة");

      const localReadings = await offlineDb.readings.orderBy("apartmentId").toArray();
      const cycleId = localReadings[0]?.cycleId;
      if (!cycleId) throw new Error("لا توجد دورة مفتوحة للاعتماد");

      const unreadCount = localReadings.filter((reading) => !reading.isRead).length;
      if (unreadCount > 0) throw new Error(`المتبقي ${unreadCount} شقق قبل الاعتماد`);

      const syncResult = await syncPendingReadings();
      if (syncResult.pendingCycles[0]?.unreadCount) {
        throw new Error(`المتبقي ${syncResult.pendingCycles[0].unreadCount} شقق قبل الاعتماد`);
      }

      const response = await fetch(`/api/cycles/${cycleId}/finalize`, { method: "PUT" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر اعتماد الدورة");

      await saveFieldPayload([]);
      await loadLocal();
      setMessage(`تم اعتماد الدورة رقم ${data.cycle.id} وتجهيز الفاتورة`);
      downloadPdf(data.cycle.id, data.cycle.weekStart);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "حدث خطأ غير متوقع");
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }

  async function copyMobileLink() {
    const link = mobileUrl || `${window.location.origin}/field`;
    setError(null);
    setMessage(null);

    try {
      await navigator.clipboard.writeText(link);
      setMessage("تم نسخ رابط القارئ الميداني");
    } catch {
      setError(link);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <CardHeader className="mb-3">
          <div>
            <CardTitle className="text-base sm:text-lg">القارئ الميداني</CardTitle>
            <CardDescription className="hidden sm:block">
              القائمة تتحدث تلقائيا عند الاتصال، وبعدها يعمل الإدخال بدون إنترنت.
            </CardDescription>
          </div>
          <Badge variant={isOnline ? "success" : "danger"}>{isOnline ? "متصل" : "بدون شبكة"}</Badge>
        </CardHeader>

        <div className="grid grid-cols-3 gap-2">
          <Button type="button" className="min-h-14 flex-col px-2 text-xs sm:min-h-12 sm:flex-row sm:text-sm" onClick={() => refreshFieldData(false)} disabled={loading || !isOnline}>
            <Download className="h-5 w-5" />
            تحديث
          </Button>
          <Button
            type="button"
            className="min-h-14 flex-col px-2 text-xs sm:min-h-12 sm:flex-row sm:text-sm"
            variant="secondary"
            onClick={sync}
            disabled={loading || !isOnline || pendingSyncCount === 0}
          >
            <RefreshCw className="h-5 w-5" />
            مزامنة
          </Button>
          <Button type="button" className="min-h-14 flex-col px-2 text-xs sm:min-h-12 sm:flex-row sm:text-sm" onClick={approveCycle} disabled={loading || !isOnline || !canApprove}>
            <CheckCircle className="h-5 w-5" />
            اعتماد
          </Button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex min-h-12 min-w-0 items-center gap-2 rounded-md border border-border bg-bg/70 px-3">
            <Smartphone className="h-5 w-5 shrink-0 text-accent" />
            <span className="number min-w-0 truncate text-xs text-text-primary sm:text-sm">{mobileUrl || "/field"}</span>
          </div>
          <Button type="button" className="min-h-12" variant="secondary" onClick={copyMobileLink}>
            <Copy className="h-5 w-5" />
            نسخ الرابط
          </Button>
        </div>

        <div className="mt-4">
          <WaterProgress value={progress.percent} label={`تم قراءة ${progress.read} من ${progress.total} شقة`} />
        </div>

        {reportUrl ? (
          <a
            href={reportUrl}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-dim"
          >
            <FileText className="h-5 w-5" />
            فتح تقرير PDF
          </a>
        ) : null}
        {message ? <p className="mt-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      </Card>

      <div className="sticky top-[112px] z-30 -mx-3 border-y border-border bg-bg/90 px-3 py-2 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث برقم الشقة أو الاسم"
            className="min-h-12 pr-10 text-base"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredReadings.map((reading) => {
          const previous = reading.canEditPrevious ? Number(previousValues[reading.id!] ?? 0) : reading.previousReading;
          const current = Number(values[reading.id!] ?? reading.previousReading);
          const consumption = Number.isFinite(current) && Number.isFinite(previous) ? Math.max(0, current - previous) : 0;
          const status = readingStatus(reading);

          return (
            <Card key={reading.id} className="flex flex-col gap-3 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-text-muted">شقة</span>
                    <h2 className="number text-3xl font-bold leading-none">{reading.apartmentNumber}</h2>
                  </div>
                  <p className="mt-2 truncate text-base font-bold text-text-primary">{reading.ownerName ?? "-"}</p>
                  <p className="text-xs text-text-muted">الطابق {reading.floor ?? "-"}</p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              <div className="grid gap-2">
                {reading.canEditPrevious ? (
                  <label className="block text-sm font-semibold text-text-muted">
                    القراءة السابقة
                    <Input
                      inputMode="decimal"
                      className="number mt-1 min-h-14 text-lg"
                      value={previousValues[reading.id!] ?? ""}
                      onChange={(event) =>
                        setPreviousValues((currentValues) => ({ ...currentValues, [reading.id!]: event.target.value }))
                      }
                    />
                  </label>
                ) : (
                  <div className="rounded-md border border-border bg-bg/70 p-3">
                    <p className="text-xs font-semibold text-text-muted">القراءة السابقة</p>
                    <p className="number mt-1 text-xl">{formatCups(reading.previousReading, 4)}</p>
                  </div>
                )}

                <label className="block text-sm font-semibold text-text-muted">
                  القراءة الحالية
                  <Input
                    inputMode="decimal"
                    className="number mt-1 min-h-14 text-lg"
                    value={values[reading.id!] ?? ""}
                    onChange={(event) => setValues((currentValues) => ({ ...currentValues, [reading.id!]: event.target.value }))}
                  />
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-text-muted">
                    ملاحظات
                    <Input
                      className="mt-1"
                      value={notes[reading.id!] ?? ""}
                      onChange={(event) => setNotes((currentNotes) => ({ ...currentNotes, [reading.id!]: event.target.value }))}
                    />
                  </label>
                  <div className="rounded-md border border-border bg-bg/70 p-3">
                    <p className="text-xs font-semibold text-text-muted">الاستهلاك</p>
                    <p className="number mt-1 text-xl text-accent">{formatCups(consumption, 2)}</p>
                  </div>
                </div>
              </div>

              <Button type="button" size="lg" className="w-full" onClick={() => save(reading)}>
                <Save className="h-5 w-5" />
                حفظ القراءة
              </Button>
            </Card>
          );
        })}
      </div>

      {!filteredReadings.length ? (
        <Card className="p-5 text-center text-sm text-text-muted">
          {query.trim() ? "لا توجد شقق مطابقة للبحث الحالي" : "لا توجد دورة مفتوحة للقراءة الآن"}
        </Card>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 px-3 py-3 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted">المتبقي للمزامنة</p>
            <p className="text-lg font-bold text-text-primary">{pendingSyncCount}</p>
          </div>
          <Button type="button" className="min-h-12 flex-1 px-2 text-xs" onClick={sync} disabled={loading || !isOnline || pendingSyncCount === 0}>
            <RefreshCw className="h-5 w-5" />
            مزامنة
          </Button>
          <Button type="button" className="min-h-12 flex-1 px-2 text-xs" onClick={approveCycle} disabled={loading || !isOnline || !canApprove}>
            <CheckCircle className="h-5 w-5" />
            اعتماد
          </Button>
        </div>
      </div>
    </div>
  );
}
