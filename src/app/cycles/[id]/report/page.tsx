import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCycleDetail } from "@/lib/db/queries";
import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CycleReportPage({ params }: { params: { id: string } }) {
  const detail = await getCycleDetail(Number(params.id));
  if (!detail) notFound();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>تقرير PDF</CardTitle>
            <CardDescription>تقرير عربي باتجاه يمين إلى يسار مع تفاصيل الكسور المرحلة.</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/api/pdf/${detail.cycle.id}`}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-dim"
          >
            <FileText className="h-4 w-4" />
            فتح التقرير
          </Link>
          <a
            href={`/api/pdf/${detail.cycle.id}?download=1`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary hover:border-accent/60"
          >
            <Download className="h-4 w-4" />
            تحميل PDF
          </a>
        </div>
      </Card>
    </div>
  );
}
