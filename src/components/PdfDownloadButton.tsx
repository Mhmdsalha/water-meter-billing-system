"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

export function PdfDownloadButton({ cycleId, weekStart }: { cycleId: number; weekStart: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pdf/${cycleId}?download=1&ts=${Date.now()}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/pdf")) {
        throw new Error("تعذر تحميل ملف PDF");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `water-cycle-${cycleId}-${weekStart}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تحميل ملف PDF");
      window.open(`/api/pdf/${cycleId}?download=1`, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" onClick={download} disabled={loading}>
        <Download className="h-4 w-4" />
        {loading ? "جاري التحميل" : "تحميل PDF"}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
