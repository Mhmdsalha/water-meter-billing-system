"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus } from "lucide-react";

export function CycleForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        readingDate: formData.get("readingDate"),
        generatorCost: formData.get("generatorCost"),
        notes: formData.get("notes")
      })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "تعذر إنشاء الدورة");
      return;
    }
    router.push(`/cycles/${data.cycle.id}/readings`);
    router.refresh();
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
    </Card>
  );
}
