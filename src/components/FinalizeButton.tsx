"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";

export function FinalizeButton({ cycleId, disabled }: { cycleId: number; disabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={finalize} disabled={disabled || loading}>
        <Lock className="h-4 w-4" />
        إغلاق الدورة وحساب الفواتير
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
