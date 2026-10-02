"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";

export function FinalizeButton({ cycleId, disabled }: { cycleId: number; disabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function finalize() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/cycles/${cycleId}/finalize`, { method: "PUT" });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "تعذر إغلاق الدورة");
      return;
    }
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => setConfirmOpen(true)} disabled={disabled || loading}>
        <Lock className="h-4 w-4" />
        إغلاق الدورة وحساب الفواتير
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Dialog open={confirmOpen} title="تأكيد إغلاق الدورة" onClose={() => !loading && setConfirmOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-text-muted">سيتم تثبيت القراءات وحساب الفواتير لهذه الدورة.</p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={finalize} disabled={loading}>{loading ? "جارٍ الاعتماد" : "تأكيد الإغلاق"}</Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)} disabled={loading}>رجوع</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
