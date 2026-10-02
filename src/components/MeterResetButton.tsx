"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Gauge, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MeterResetButton({ apartmentId }: { apartmentId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [baselineReading, setBaselineReading] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/apartments/${apartmentId}/meter-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baselineReading, notes })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر ضبط قراءة العداد");
      setOpen(false);
      setConfirmSave(false);
      setBaselineReading("");
      setNotes("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر ضبط قراءة العداد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Gauge className="h-4 w-4" />
        تغيير العداد
      </Button>
      <Dialog open={open} title="تغيير العداد" onClose={() => !loading && setOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-text-muted">لن تتغير أي فاتورة أو دورة سابقة. ستُستخدم قراءة البداية الجديدة للدورة المفتوحة، أو للدورة التالية إذا لم توجد دورة مفتوحة.</p>
          <label className="block text-sm font-semibold text-text-muted">
            قراءة بداية العداد الجديد
            <Input value={baselineReading} inputMode="decimal" className="number mt-1" placeholder="0.00" onChange={(event) => setBaselineReading(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-text-muted">
            ملاحظة
            <Textarea value={notes} className="mt-1" placeholder="مثال: تم تركيب عداد جديد" onChange={(event) => setNotes(event.target.value)} />
          </label>
          {error ? <p className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
          <Button type="button" className="w-full" disabled={loading || !baselineReading.trim()} onClick={() => setConfirmSave(true)}>
            <Save className="h-4 w-4" />
            حفظ قراءة البداية
          </Button>
        </div>
      </Dialog>
      <Dialog open={confirmSave} title="تأكيد تغيير قراءة العداد" onClose={() => !loading && setConfirmSave(false)}>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-text-muted">استخدام القراءة <span className="number font-bold text-text-primary">{baselineReading}</span> كبداية للعداد الجديد؟</p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" disabled={loading} onClick={submit}>{loading ? "جارٍ الحفظ" : "تأكيد الحفظ"}</Button>
            <Button type="button" variant="secondary" disabled={loading} onClick={() => setConfirmSave(false)}>رجوع</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
