"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CycleDeleteButton({ cycleId, label }: { cycleId: number; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cycles/${cycleId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "تعذر حذف الدورة");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)} aria-label={`حذف ${label}`}>
        <Trash2 className="h-4 w-4" />
        حذف
      </Button>
      <Dialog open={open} title="حذف الدورة" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm leading-7 text-text-muted">
            سيتم حذف {label} مع قراءاتها ومدفوعاتها، ثم إعادة حساب الدورات التي بعدها بناء على آخر قراءة باقية.
          </p>
          {error ? <p className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="danger" onClick={remove} disabled={loading}>
              تأكيد الحذف
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
