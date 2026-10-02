"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus } from "lucide-react";

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CycleForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientRequestId, setClientRequestId] = useState(createRequestId);
  const [pendingForm, setPendingForm] = useState<FormData | null>(null);

  function submit(formData: FormData) {
    setPendingForm(formData);
  }

  async function createCycle(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readingDate: formData.get("readingDate"),
          generatorCost: formData.get("generatorCost"),
          notes: formData.get("notes"),
          clientRequestId
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "تعذر إنشاء الدورة");
        return;
      }
      setPendingForm(null);
      setClientRequestId(createRequestId());
      router.push("/field");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر إنشاء الدورة، أعد المحاولة وسيتم استخدام نفس طلب الحفظ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div>
          <CardTitle>دورة فوترة جديدة</CardTitle>
          <CardDescription>سيتم إنشاء قراءات لكل الشقق الفعالة مع ترحيل آخر كسر تلقائيا.</CardDescription>
        </div>
      </CardHeader>
      <form action={submit} className="grid gap-4">
        <label className="block text-sm text-text-muted">
          تاريخ القراءة
          <Input name="readingDate" type="date" required className="number mt-1" />
        </label>
        <label className="block text-sm text-text-muted sm:col-span-2">
          تكلفة المولد
          <Input name="generatorCost" type="number" step="0.01" min="0.01" required className="number mt-1" />
        </label>
        <label className="block text-sm text-text-muted sm:col-span-2">
          ملاحظات
          <Textarea name="notes" className="mt-1" />
        </label>
        {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}
        <Button type="submit" disabled={loading} className="sm:col-span-2">
          <CalendarPlus className="h-4 w-4" />
          إنشاء الدورة
        </Button>
      </form>
      <Dialog open={Boolean(pendingForm)} title="تأكيد إنشاء الدورة" onClose={() => !loading && setPendingForm(null)}>
        {pendingForm ? <div className="space-y-4">
          <p className="text-sm leading-6 text-text-muted">إنشاء دورة بتاريخ <span className="number font-bold text-text-primary">{String(pendingForm.get("readingDate") ?? "")}</span> وتكلفة <span className="number font-bold text-text-primary">₪ {String(pendingForm.get("generatorCost") ?? "")}</span>؟</p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" disabled={loading} onClick={() => void createCycle(pendingForm)}>{loading ? "جارٍ الإنشاء" : "تأكيد الإنشاء"}</Button>
            <Button type="button" variant="secondary" disabled={loading} onClick={() => setPendingForm(null)}>رجوع</Button>
          </div>
        </div> : null}
      </Dialog>
    </Card>
  );
}
