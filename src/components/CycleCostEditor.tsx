"use client";

import type { CycleRow } from "@/lib/db/queries";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Calculator, Pencil } from "lucide-react";

export function CycleCostEditor({ cycle }: { cycle: CycleRow }) {
  const router = useRouter();
  const [generatorCost, setGeneratorCost] = useState(String(cycle.generatorCost));
  const [weekStart, setWeekStart] = useState(cycle.weekStart);
  const [notes, setNotes] = useState(cycle.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function save(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/cycles/${cycle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatorCost: Number(generatorCost), weekStart, notes })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "تعذر تحديث المبلغ");
      return;
    }

    setMessage(`تم تحديث بيانات الدورة وإعادة الفوترة. المستحق الآن ₪ ${formatMoney(data.cycle?.totalBilled)}`);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-bg/55 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-text-muted">تاريخ القراءة والمبلغ المطلوب</p>
          <p className="number mt-1 text-2xl font-bold text-accent">₪ {formatMoney(cycle.generatorCost)}</p>
          <p className="mt-1 text-sm text-text-muted">{cycle.weekStart}</p>
        </div>
        <Button type="button" variant="secondary" className="min-h-12" onClick={() => setOpen(true)}>
          <Pencil className="h-4 w-4" />
          تعديل بيانات الدورة
        </Button>
      </div>
      {message ? <p className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{message}</p> : null}
      <Dialog
        open={open}
        title="تعديل مبلغ الدورة"
        onClose={() => {
          setOpen(false);
          setError(null);
          setGeneratorCost(String(cycle.generatorCost));
          setWeekStart(cycle.weekStart);
          setNotes(cycle.notes ?? "");
        }}
      >
        <form className="space-y-4" onSubmit={save}>
          <label className="block text-sm text-text-muted">
            تاريخ القراءة
            <Input type="date" className="number mt-1" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} />
          </label>
          <label className="block text-sm text-text-muted">
            تكلفة المولد / المبلغ المطلوب
            <Input
              type="number"
              min="0.01"
              step="0.01"
              className="number mt-1"
              value={generatorCost}
              onChange={(event) => setGeneratorCost(event.target.value)}
            />
          </label>
          <label className="block text-sm text-text-muted">
            ملاحظات
            <Input className="mt-1" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          {error ? <p className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
          <Button
            type="submit"
            variant="secondary"
            className="w-full border-accent/60 bg-accent/15 text-accent hover:bg-accent/25"
            disabled={loading}
          >
            <Calculator className="h-4 w-4" />
            {loading ? "جاري الحفظ..." : "حفظ وإعادة الفوترة"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
